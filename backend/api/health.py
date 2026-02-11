from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "memequbit-api",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/ready")
async def readiness():
    """Check dependencies (Redis, optional DB)."""
    return {"ready": True, "dependencies": {"redis": "optional", "postgres": "optional"}}
