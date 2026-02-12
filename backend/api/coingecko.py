"""
CoinGecko proxy API — prices and market data.
API key is used server-side only (never exposed to frontend).
"""

from fastapi import APIRouter, Query, HTTPException

from services.coingecko import simple_price, ping

router = APIRouter()


@router.get("/ping")
async def coingecko_ping() -> dict:
    """Check CoinGecko API connectivity."""
    ok = await ping()
    return {"ok": ok, "service": "coingecko"}


@router.get("/price")
async def get_price(
    ids: str = Query(..., description="Comma-separated CoinGecko coin ids (e.g. bitcoin,ethereum,solana)"),
    vs_currencies: str = Query("usd", description="Comma-separated currencies (e.g. usd,eur)"),
    include_market_cap: bool = Query(False),
    include_24hr_vol: bool = Query(False),
    include_24hr_change: bool = Query(False),
    include_last_updated_at: bool = Query(False),
) -> dict:
    """
    Get current price for one or more coins by CoinGecko ID.
    Uses the project's CoinGecko Demo API key (set COINGECKO_DEMO_API_KEY in .env).
    """
    id_list = [x.strip().lower() for x in ids.split(",") if x.strip()]
    if not id_list:
        raise HTTPException(status_code=400, detail="At least one coin id required")
    vs_list = [x.strip().lower() for x in vs_currencies.split(",") if x.strip()] or ["usd"]
    try:
        data = await simple_price(
            ids=id_list,
            vs_currencies=vs_list,
            include_market_cap=include_market_cap,
            include_24hr_vol=include_24hr_vol,
            include_24hr_change=include_24hr_change,
            include_last_updated_at=include_last_updated_at,
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"CoinGecko request failed: {e!s}") from e
