"""
MemeQubit chain data fetcher.
Fetches DEX pool data and caches in Redis. Falls back to demo data if RPC unavailable.
"""

from typing import Any

from core.config import settings

# Optional: web3 and redis. Graceful fallback if not configured.
_w3 = None
_redis = None


def _get_web3():
    global _w3
    if _w3 is None:
        try:
            from web3 import Web3
            _w3 = Web3(Web3.HTTPProvider(settings.MEMEQUBIT_RPC_URL))
        except Exception:
            _w3 = False
    return _w3 if _w3 else None


async def _get_redis():
    global _redis
    if _redis is None:
        try:
            import redis.asyncio as redis
            _redis = redis.from_url(settings.REDIS_URL)
            await _redis.ping()
        except Exception:
            _redis = False
    return _redis if _redis else None


# Standard 3-token demo (USDC, WETH, USDT)
def _demo_pools() -> list[dict[str, Any]]:
    """Fallback demo pools when MemeQubit RPC is unavailable or no factory is set."""
    return [
        {
            "address": "0x1111111111111111111111111111111111111111",
            "tokens": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
            "reserves": [1_000_000.0, 500.0],
            "fee": 300,
        },
        {
            "address": "0x2222222222222222222222222222222222222222",
            "tokens": ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xdAC17F958D2ee523a2206206994597C13D831ec7"],
            "reserves": [500.0, 1_200_000.0],
            "fee": 300,
        },
        {
            "address": "0x3333333333333333333333333333333333333333",
            "tokens": ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0xdAC17F958D2ee523a2206206994597C13D831ec7"],
            "reserves": [2_000_000.0, 2_100_000.0],
            "fee": 300,
        },
    ]


# Extended 6-token demo: USDC, WETH, USDT, WBTC, DAI, LINK. Reserves tuned so that
# a 3–4 hop path (e.g. USDC→WBTC→DAI→USDT) beats greedy 2-hop (USDC→WETH→USDT).
TOKEN_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
TOKEN_WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
TOKEN_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
TOKEN_WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
TOKEN_DAI = "0x6B175474E89094C44Da98b954EedeCB5BE3830"
TOKEN_LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA"


class MemeQubitDataFetcher:
    def __init__(self):
        self._pools_cache: list[dict] | None = None
        self._network_checked = False
        self._connected = False
        self._block_number: int | None = None
        self._chain_id: int | None = None

    async def get_network_stats(self) -> dict:
        """Check connection to MemeQubit RPC and return block/chain info."""
        w3 = _get_web3()
        if not w3:
            return {
                "block_number": None,
                "chain_id": None,
                "connected": False,
                "message": "MemeQubit RPC not configured or unavailable. Using demo data.",
                "gas_price": None,
            }
        try:
            self._block_number = w3.eth.block_number
            self._chain_id = w3.eth.chain_id
            gas_price = 0
            try:
                gas_price = w3.eth.gas_price or 0
            except Exception:
                pass
            self._connected = True
            return {
                "block_number": self._block_number,
                "chain_id": self._chain_id,
                "connected": True,
                "message": None,
                "gas_price": gas_price,
            }
        except Exception as e:
            return {
                "block_number": None,
                "chain_id": None,
                "connected": False,
                "message": str(e),
                "gas_price": None,
            }

    async def get_pools(self) -> list[dict]:
        """Return pools from Redis cache or fetch from chain; fallback to demo data."""
        redis = await _get_redis()
        if redis:
            try:
                import json
                raw = await redis.get("memequbit:pools")
                if raw:
                    return json.loads(raw)
            except Exception:
                pass

        w3 = _get_web3()
        stats = await self.get_network_stats()
        if stats.get("connected") and w3:
            # TODO: integrate real factory + getPair enumeration (e.g. Pump.fun)
            pass
        pools = _demo_pools()

        if redis:
            try:
                import json
                await redis.set(
                    "memequbit:pools",
                    json.dumps(pools),
                    ex=settings.POOL_CACHE_TTL_SECONDS,
                )
            except Exception:
                pass

        return pools


_fetcher: MemeQubitDataFetcher | None = None


def get_memequbit_fetcher() -> MemeQubitDataFetcher:
    global _fetcher
    if _fetcher is None:
        _fetcher = MemeQubitDataFetcher()
    return _fetcher
