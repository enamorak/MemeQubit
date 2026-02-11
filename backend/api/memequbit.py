"""
MemeQubit Network gateway: pool data, network stats.
Uses configured RPC (e.g. Base/Arbitrum testnet) when available.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.memequbit_fetcher import get_memequbit_fetcher

router = APIRouter()


class PoolInfo(BaseModel):
    address: str
    tokens: list[str]
    reserves: list[float]
    fee: int  # basis points


class NetworkStats(BaseModel):
    block_number: Optional[int] = None
    chain_id: Optional[int] = None
    connected: bool
    message: Optional[str] = None
    gas_price: Optional[int] = None


@router.get("/network")
async def network_status() -> NetworkStats:
    """Return MemeQubit chain connection status and basic stats."""
    fetcher = get_memequbit_fetcher()
    data = await fetcher.get_network_stats()
    return NetworkStats(**data)


@router.get("/pools")
async def list_pools() -> list[PoolInfo]:
    """Return cached list of DEX pools (from fetcher or fallback demo data)."""
    fetcher = get_memequbit_fetcher()
    pools = await fetcher.get_pools()
    return [PoolInfo(**p) for p in pools]
