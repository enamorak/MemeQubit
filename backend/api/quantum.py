"""
Quantum simulation API: arbitrage, scheduler, liquidation.

Endpoints (see README "Functions and Algorithms" for algorithms and I/O):
- POST /arbitrage  — optimal swap path (Arbitrage Pathfinder)
- POST /scheduler  — transaction schedule (Transaction Scheduler)
- POST /liquidation — liquidation strategy (Liquidation Optimizer)

All computations use classical simulators (simulated annealing / QUBO) for PoC.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.quantum_simulator import (
    solve_arbitrage,
    solve_scheduler,
    solve_liquidation,
)
from services.quantum_vision import (
    solve_yield_scheduling,
    solve_pool_risk_classifier,
    solve_prediction_market_amm,
)
from services.meme_quantum import solve_sniper, solve_batch_exit, solve_hedge_finder
from models.quantum import (
    ArbitrageRequest,
    ArbitrageResponse,
    SchedulerRequest,
    SchedulerResponse,
    LiquidationRequest,
    LiquidationResponse,
    YieldSchedulingRequest,
    YieldSchedulingResponse,
    PoolRiskRequest,
    PoolRiskResponse,
    PredictionMarketRequest,
    PredictionMarketResponse,
    SniperRequest,
    SniperResponse,
    BatchExitRequest,
    BatchExitResponse,
    HedgeFinderRequest,
    HedgeFinderResponse,
)

router = APIRouter()


@router.get("/status")
async def quantum_status():
    """Simulator status: classical (simulated annealing) for PoC."""
    return {
        "backend": "classical",
        "simulator": "dimod/neal (simulated annealing)",
        "ready": True,
        "message": "Quantum computations are simulated for this prototype.",
    }


@router.post("/arbitrage", response_model=ArbitrageResponse)
async def api_arbitrage(req: ArbitrageRequest):
    """Quantum Arbitrage Pathfinder: find optimal path across pools (QUBO + simulated annealing)."""
    return await solve_arbitrage(req)


@router.post("/scheduler", response_model=SchedulerResponse)
async def api_scheduler(req: SchedulerRequest):
    """Quantum Transaction Scheduler: minimize conflicts (graph coloring QUBO)."""
    return await solve_scheduler(req)


@router.post("/liquidation", response_model=LiquidationResponse)
async def api_liquidation(req: LiquidationRequest):
    """Quantum Liquidation Optimizer: optimal set of positions to liquidate."""
    return await solve_liquidation(req)


# --- Quantum Vision: Yield Infra & Prediction Market ---


@router.post("/yield-scheduling", response_model=YieldSchedulingResponse)
async def api_yield_scheduling(req: YieldSchedulingRequest):
    """Yield Infra: quantum scheduling batches reinvest txs → 20–40% gas savings."""
    return await solve_yield_scheduling(req)


@router.post("/pool-risk", response_model=PoolRiskResponse)
async def api_pool_risk(req: PoolRiskRequest):
    """Pool risk classifier: quantum evaluates 10+ factors for accurate risk scores."""
    return await solve_pool_risk_classifier(req)


@router.post("/prediction-market", response_model=PredictionMarketResponse)
async def api_prediction_market(req: PredictionMarketRequest):
    """Prediction market AMM: quantum dynamic curve → 15–30% less slippage."""
    return await solve_prediction_market_amm(req)


# --- MemeQubit: Sniper, Batch Exit, Hedge Finder ---


@router.post("/sniper", response_model=SniperResponse)
async def api_sniper(req: SniperRequest):
    """Quantum Sniper: rank new Pump.fun pools by entry score. Classical = rules; Quantum = QUBO."""
    return await solve_sniper(req)


@router.post("/batch-exit", response_model=BatchExitResponse)
async def api_batch_exit(req: BatchExitRequest):
    """Quantum Batching: split sell into N batches. Classical = 1 tx; Quantum = optimal batches."""
    return await solve_batch_exit(req)


@router.post("/hedge-finder", response_model=HedgeFinderResponse)
async def api_hedge_finder(req: HedgeFinderRequest):
    """Quantum Hedge Finder: best path from held token to stable. Classical = 2-hop; Quantum = full path."""
    return await solve_hedge_finder(req)
