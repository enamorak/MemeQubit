"""
CoinGecko API client — simple price and market data.
Uses Demo API key via header x-cg-demo-api-key when COINGECKO_DEMO_API_KEY is set.
Docs: https://docs.coingecko.com/reference/simple-price
"""

from typing import Any

import httpx
from core.config import settings

COINGECKO_BASE = "https://api.coingecko.com/api/v3"


def _headers() -> dict[str, str]:
    h: dict[str, str] = {"Accept": "application/json"}
    if settings.COINGECKO_DEMO_API_KEY:
        h["x-cg-demo-api-key"] = settings.COINGECKO_DEMO_API_KEY
    return h


async def simple_price(
    ids: list[str],
    vs_currencies: list[str] | None = None,
    include_market_cap: bool = False,
    include_24hr_vol: bool = False,
    include_24hr_change: bool = False,
    include_last_updated_at: bool = False,
) -> dict[str, Any]:
    """
    Get current price for coins by CoinGecko IDs.
    ids: e.g. ["bitcoin", "ethereum", "solana"]
    vs_currencies: e.g. ["usd"] (default)
    """
    vs_currencies = vs_currencies or ["usd"]
    params: dict[str, Any] = {
        "ids": ",".join(ids),
        "vs_currencies": ",".join(vs_currencies),
        "include_market_cap": str(include_market_cap).lower(),
        "include_24hr_vol": str(include_24hr_vol).lower(),
        "include_24hr_change": str(include_24hr_change).lower(),
        "include_last_updated_at": str(include_last_updated_at).lower(),
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{COINGECKO_BASE}/simple/price",
            params=params,
            headers=_headers(),
        )
        r.raise_for_status()
        return r.json()


async def ping() -> bool:
    """Check CoinGecko API status."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                f"{COINGECKO_BASE}/ping",
                headers=_headers(),
            )
            return r.status_code == 200
    except Exception:
        return False
