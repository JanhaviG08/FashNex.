"""
app.py — FashNex AI Service  (UPDATED)
=======================================
Port change: 8000 → 5001
Reason: Node backend already runs on port 8000 (Backend/.env: PORT=8000).
        Running both on 8000 causes EADDRINUSE errors.

Startup:
  uvicorn app:app --host 0.0.0.0 --port 5001 --reload
  OR:  python app.py

Endpoints:
  POST /recommend   — ML outfit recommendations (wardrobe items in, outfits out)
  POST /invalidate  — Drop cached model for a user
  GET  /health      — Service health check
  GET  /docs        — Swagger UI
"""

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.recommend import router as recommend_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(name)s: %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger('fashnex-ai')

app = FastAPI(
    title='FashNex AI Service',
    description='ML outfit recommendation engine. Called by Node backend on port 8000.',
    version='2.0.0',
    docs_url='/docs',
    redoc_url='/redoc',
)

# ── CORS — allow the Node backend (8000) and React dev server (5173/5174) ─────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:8000',   # Node.js backend (calls /recommend)
        'http://localhost:5173',   # React Vite dev server
        'http://localhost:5174',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:5173',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(recommend_router, prefix='', tags=['Recommendations'])

@app.get('/', tags=['Root'])
async def root():
    return {
        'service':  'FashNex AI',
        'version':  '2.0.0',
        'port':     5001,
        'endpoints': {
            'POST /recommend':  'ML-ranked outfit combinations (called by Node)',
            'POST /invalidate': 'Invalidate model cache for a user',
            'GET  /health':     'Service status',
            'GET  /docs':       'Swagger UI',
        }
    }

if __name__ == '__main__':
    logger.info('FashNex AI Service → http://0.0.0.0:5001')
    uvicorn.run('app:app', host='0.0.0.0', port=5001, reload=True, log_level='info')