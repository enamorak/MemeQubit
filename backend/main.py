"""
MemeQubit - Classical Core API
Proof-of-concept backend for quantum simulation and MemeQubit chain integration.
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import health, quantum, memequbit
from core.config import settings

_background_task: asyncio.Task | None = None


async def _pool_refresh_loop():
    """Refresh pool cache every 30 seconds (TTL aligned)."""
    from services.memequbit_fetcher import get_memequbit_fetcher
    fetcher = get_memequbit_fetcher()
    while True:
        try:
            await asyncio.sleep(settings.POOL_CACHE_TTL_SECONDS)
            await fetcher.get_pools()
            print(f"Pool cache refreshed at {datetime.utcnow().isoformat()}")
        except asyncio.CancelledError:
            print("Pool refresh task cancelled")
            break
        except Exception as e:
            print(f"Error refreshing pool cache: {e}")
            await asyncio.sleep(5)  # Wait before retry


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _background_task
    _background_task = asyncio.create_task(_pool_refresh_loop())
    yield
    if _background_task:
        _background_task.cancel()
        try:
            await _background_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="MemeQubit API",
    description="Classical Core API for MemeQubit — quantum-AI copilot for Pump.fun traders",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(quantum.router, prefix="/api/quantum", tags=["Quantum"])
app.include_router(memequbit.router, prefix="/api/memequbit", tags=["MemeQubit"])


@app.get("/")
async def root():
    return {
        "service": "MemeQubit Classical Core API",
        "docs": "/docs",
        "status": "experimental",
        "disclaimer": "This is a research prototype. Not production-ready.",
    }
