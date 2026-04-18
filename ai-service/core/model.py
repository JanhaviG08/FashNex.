"""
core/model.py
=============
ML models for outfit scoring.

Architecture:
  - ModelRegistry: singleton that holds trained models in memory.
    Models are NEVER retrained on every request — only when the wardrobe
    changes or when explicitly invalidated.

  - DecisionTreeScorer: sklearn DecisionTreeRegressor (fast, interpretable,
    works even with very small datasets ~5 items)

  - NeuralNetScorer: TensorFlow/Keras MLP (better generalisation for larger
    wardrobes, falls back gracefully if TF is not installed)

  - EnsembleScorer: weighted average of both (default scorer used in production)

Training data is generated synthetically by:
  1. combinator.py  → generates all possible (top, bottom, shoe) combos
  2. preprocessing.py → converts each combo to a feature vector (X)
  3. scoring.py     → computes rule-based label for each combo (y)

The model is then fitted on (X, y) and cached in memory.
"""

import numpy as np
import logging
import hashlib
import json
from typing import List, Dict, Optional, Tuple

from .preprocessing import outfit_to_vector, OUTFIT_DIM
from .scoring import score_outfit, generate_training_labels
from .combinator import generate_combos

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────
# DECISION TREE SCORER (sklearn — always available)
# ─────────────────────────────────────────────────────────────────

class DecisionTreeScorer:
    """
    Lightweight sklearn DecisionTreeRegressor.
    Trains in milliseconds even on tiny datasets (2–10 items).
    """

    def __init__(self):
        from sklearn.tree import DecisionTreeRegressor
        # max_depth=6 prevents overfitting on small synthetic datasets
        self._model = DecisionTreeRegressor(
            max_depth=6,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
        )
        self._trained = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        if len(X) < 2:
            logger.warning("DecisionTree: too few samples (%d), skipping fit", len(X))
            return
        self._model.fit(X, y)
        self._trained = True
        logger.info("DecisionTree: trained on %d samples", len(X))

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self._trained:
            # Return neutral scores if not trained yet
            return np.full(len(X), 0.5, dtype=np.float32)
        return np.clip(self._model.predict(X).astype(np.float32), 0.0, 1.0)

    @property
    def is_trained(self) -> bool:
        return self._trained


# ─────────────────────────────────────────────────────────────────
# NEURAL NETWORK SCORER (TensorFlow — optional)
# ─────────────────────────────────────────────────────────────────

class NeuralNetScorer:
    """
    Small Keras MLP for outfit scoring.
    Falls back gracefully if TensorFlow is not installed.

    Architecture:
      Input(99) → Dense(128, ReLU) → Dropout(0.2)
               → Dense(64,  ReLU) → Dropout(0.2)
               → Dense(32,  ReLU)
               → Dense(1, Sigmoid)   ← output in [0, 1]
    """

    TF_AVAILABLE: bool = False

    def __init__(self):
        try:
            import tensorflow as tf
            NeuralNetScorer.TF_AVAILABLE = True
            self._model = self._build_model()
            self._trained = False
            logger.info("NeuralNet: TensorFlow %s loaded", tf.__version__)
        except ImportError:
            logger.warning("NeuralNet: TensorFlow not installed — NN scorer disabled")
            self._model  = None
            self._trained = False

    def _build_model(self):
        import tensorflow as tf
        from tensorflow import keras

        model = keras.Sequential([
            keras.layers.Input(shape=(OUTFIT_DIM,)),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(64,  activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32,  activation='relu'),
            keras.layers.Dense(1,   activation='sigmoid'),
        ], name='outfit_scorer')

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae'],
        )
        return model

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        if not self.TF_AVAILABLE or self._model is None:
            return
        if len(X) < 4:
            logger.warning("NeuralNet: too few samples (%d) for NN training", len(X))
            return

        # Use a fraction for validation if we have enough samples
        val_split = 0.15 if len(X) >= 20 else 0.0

        self._model.fit(
            X, y,
            epochs=40,
            batch_size=max(4, min(32, len(X) // 4)),
            validation_split=val_split,
            verbose=0,           # silent — logs only via logger
            callbacks=[],
        )
        self._trained = True
        logger.info("NeuralNet: trained on %d samples", len(X))

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.TF_AVAILABLE or not self._trained or self._model is None:
            return np.full(len(X), 0.5, dtype=np.float32)
        preds = self._model.predict(X, verbose=0)
        return np.clip(preds.flatten().astype(np.float32), 0.0, 1.0)

    @property
    def is_trained(self) -> bool:
        return self._trained


# ─────────────────────────────────────────────────────────────────
# ENSEMBLE SCORER
# ─────────────────────────────────────────────────────────────────

class EnsembleScorer:
    """
    Weighted average of DT and NN scores.
    Weights adjust automatically based on what's trained.
    """

    def __init__(self):
        self.dt = DecisionTreeScorer()
        self.nn = NeuralNetScorer()

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        self.dt.fit(X, y)
        self.nn.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        dt_preds = self.dt.predict(X)

        if self.nn.is_trained:
            nn_preds = self.nn.predict(X)
            # Give NN 40% weight when trained, otherwise pure DT
            return 0.6 * dt_preds + 0.4 * nn_preds
        return dt_preds

    @property
    def is_trained(self) -> bool:
        return self.dt.is_trained


# ─────────────────────────────────────────────────────────────────
# MODEL REGISTRY — singleton, in-memory cache
# ─────────────────────────────────────────────────────────────────

class ModelRegistry:
    """
    Singleton that:
      - Holds one trained EnsembleScorer per user (keyed by userId)
      - Tracks a hash of the wardrobe to detect changes
      - Only retrains when the wardrobe hash changes
      - Falls back to rule-based scoring if ML fails
    """

    _instance: Optional['ModelRegistry'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._scorers: Dict[str, EnsembleScorer] = {}
            cls._instance._hashes:  Dict[str, str]            = {}
        return cls._instance

    # ── Public interface ──────────────────────────────────────────────────────

    def get_or_train(
        self,
        user_id:  str,
        wardrobe: List[Dict],
        season:   str = 'all-season',
        occasion: str = 'casual',
    ) -> 'EnsembleScorer':
        """
        Return a trained scorer for this user.
        Retrains only if the wardrobe has changed since last call.
        """
        wardrobe_hash = self._hash_wardrobe(wardrobe)
        cache_key     = f"{user_id}_{season}_{occasion}"

        if (cache_key not in self._scorers or
                self._hashes.get(cache_key) != wardrobe_hash):
            logger.info("ModelRegistry: (re)training for user=%s season=%s occasion=%s",
                        user_id, season, occasion)
            scorer = self._train(wardrobe, season, occasion)
            self._scorers[cache_key] = scorer
            self._hashes[cache_key]  = wardrobe_hash
        else:
            logger.debug("ModelRegistry: cache HIT for user=%s", user_id)

        return self._scorers[cache_key]

    def invalidate(self, user_id: str) -> None:
        """Force retrain next request (call when user uploads/deletes wardrobe items)."""
        keys_to_remove = [k for k in self._scorers if k.startswith(user_id)]
        for k in keys_to_remove:
            del self._scorers[k]
            del self._hashes[k]
        logger.info("ModelRegistry: invalidated cache for user=%s", user_id)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _hash_wardrobe(self, wardrobe: List[Dict]) -> str:
        """Deterministic hash of relevant item fields. Used to detect changes."""
        key_fields = ('_id', 'category', 'color', 'season', 'occasion', 'colorFamily')
        data = sorted([
            {k: str(item.get(k, '')) for k in key_fields}
            for item in wardrobe
        ], key=lambda d: d.get('_id', ''))
        return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()

    def _train(
        self,
        wardrobe: List[Dict],
        season:   str,
        occasion: str,
    ) -> EnsembleScorer:
        """
        Generate synthetic training data from the wardrobe and train the model.

        Steps:
          1. Generate all outfit combos
          2. Build feature matrix X (one row per combo)
          3. Compute rule-based labels y
          4. Fit EnsembleScorer
        """
        scorer = EnsembleScorer()

        if len(wardrobe) < 2:
            logger.warning("Wardrobe too small to train (%d items) — using rule-based fallback", len(wardrobe))
            return scorer

        # Step 1: Generate combos
        combos = generate_combos(wardrobe, max_combos=500)
        if not combos:
            logger.warning("No valid combos generated — using rule-based fallback")
            return scorer

        # Step 2: Build feature matrix
        X_rows = []
        outfit_meta = []  # keep for label generation
        for combo in combos:
            try:
                vec = outfit_to_vector(combo['top'], combo['bottom'], combo['shoe'])
                X_rows.append(vec)
                outfit_meta.append({
                    'top':    combo['top'],
                    'bottom': combo['bottom'],
                    'shoe':   combo['shoe'],
                    'target_season':   season,
                    'target_occasion': occasion,
                })
            except Exception as e:
                logger.debug("Skipping combo: %s", e)

        if not X_rows:
            return scorer

        X = np.stack(X_rows, axis=0)

        # Step 3: Generate labels
        y = generate_training_labels(outfit_meta)

        logger.info("Training on X=%s y=%s", X.shape, y.shape)

        # Step 4: Fit
        try:
            scorer.fit(X, y)
        except Exception as e:
            logger.error("Model training failed: %s", e)

        return scorer


# Module-level singleton
registry = ModelRegistry()