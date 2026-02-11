"""
Extended demo pools for quantum simulations.
"""

TOKEN_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
TOKEN_WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
TOKEN_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
TOKEN_WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
TOKEN_DAI = "0x6B175474E89094C44Da98b954EedeCB5BE3830"
TOKEN_LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA"


def get_extended_demo_pools():
    """Extended graph with 6 tokens: best multi-hop path beats greedy 2-hop (for demo)."""
    return [
        {"address": "0xe1", "tokens": [TOKEN_USDC, TOKEN_WETH], "reserves": [1_000_000.0, 400.0], "fee": 300},
        {"address": "0xe2", "tokens": [TOKEN_WETH, TOKEN_USDT], "reserves": [400.0, 800_000.0], "fee": 300},
        {"address": "0xe3", "tokens": [TOKEN_USDC, TOKEN_USDT], "reserves": [2_000_000.0, 1_900_000.0], "fee": 300},
        {"address": "0xe4", "tokens": [TOKEN_USDC, TOKEN_WBTC], "reserves": [500_000.0, 25.0], "fee": 300},
        {"address": "0xe5", "tokens": [TOKEN_WBTC, TOKEN_DAI], "reserves": [25.0, 400_000.0], "fee": 300},
        {"address": "0xe6", "tokens": [TOKEN_DAI, TOKEN_USDT], "reserves": [400_000.0, 450_000.0], "fee": 300},
        {"address": "0xe7", "tokens": [TOKEN_WETH, TOKEN_WBTC], "reserves": [350.0, 18.0], "fee": 300},
        {"address": "0xe8", "tokens": [TOKEN_DAI, TOKEN_WETH], "reserves": [300_000.0, 200.0], "fee": 300},
        {"address": "0xe9", "tokens": [TOKEN_USDC, TOKEN_LINK], "reserves": [800_000.0, 50_000.0], "fee": 300},
        {"address": "0xea", "tokens": [TOKEN_LINK, TOKEN_USDT], "reserves": [50_000.0, 600_000.0], "fee": 300},
    ]