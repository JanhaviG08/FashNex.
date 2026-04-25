"""
app.py — FashNex AI Service  (UPDATED)
=======================================
Changes vs previous version:
  - Registers new router: routes/weather_recommend.py
  - All existing routers (recommend, invalidate, health) unchanged

Port: 5001  (Node backend is on 8000)

Run:
  uvicorn app:app --host 0.0.0.0 --port 5001 --reload
  OR: python app.py
"""

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.recommend          import router as recommend_router
from routes.weather_recommend  import router as weather_recommend_router   # ← NEW

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(name)s: %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger('fashnex-ai')

app = FastAPI(
    title='FashNex AI Service',
    description='ML outfit recommendation + weather-aware product ranking.',
    version='3.0.0',
    docs_url='/docs',
    redoc_url='/redoc',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:8000',   # Node.js backend
        'http://localhost:5173',   # React Vite dev server
        'http://localhost:5174',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:5173',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(recommend_router,        prefix='',         tags=['Wardrobe Outfits'])
app.include_router(weather_recommend_router, prefix='',        tags=['Weather Recommendations'])  # ← NEW

@app.get('/', tags=['Root'])
async def root():
    return {
        'service': 'FashNex AI', 'version': '3.0.0', 'port': 5001,
        'endpoints': {
            'POST /recommend':               'ML wardrobe outfit recommendations',
            'POST /recommend/weather':       'Weather-aware product ranking (NEW)',
            'GET  /recommend/weather/profile': 'Weather profile + style tips (NEW)',
            'POST /invalidate':              'Invalidate model cache',
            'GET  /health':                  'Service health',
            'GET  /docs':                    'Swagger UI',
        }
    }

if __name__ == '__main__':
    logger.info('FashNex AI Service → http://0.0.0.0:5001')
    uvicorn.run('app:app', host='0.0.0.0', port=5001, reload=True, log_level='info')