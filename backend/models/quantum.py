"""
Pydantic models for quantum module requests/responses.
"""

from pydantic import BaseModel
from typing import Optional


class PoolInput(BaseModel):
    address: str
    tokens: list[str]
    reserves: list[float]
    fee: int = 300  # basis points


class ArbitrageRequest(BaseModel):
    token_in: str
    token_out: str
    pools: list[PoolInput]
    max_hops: int = 4
    amount_in: float = 1000.0
    use_extended_demo: bool = False  # Use 6-token graph where quantum (full path) beats greedy (2-hop)


class TransactionRef(BaseModel):
    pool: str
    action: str = "swap"
    amount: float


class ArbitrageComparison(BaseModel):
    classical_path: list[str]
    classical_profit: float
    classical_time_ms: float
    quantum_path: list[str]
    quantum_profit: float
    quantum_time_ms: float
    improvement_pct: float  # (quantum - classical) / classical * 100 when classical > 0
    winner: str  # "quantum" or "classical"


class ArbitrageResponse(BaseModel):
    optimal_path: list[str]
    expected_profit: float
    transactions: list[TransactionRef]
    simulation_time: float  # ms
    classical_baseline: Optional[float] = None
    comparison: Optional[ArbitrageComparison] = None
    quantum_metrics: Optional[dict] = None  # paths_evaluated, max_hops, solver_ms, qubo_approx_vars


# --- Scheduler ---


class PendingOrder(BaseModel):
    id: str
    type: str = "swap"
    pair: str
    account: str
    reads: list[str] = []
    writes: list[str] = []


class SchedulerRequest(BaseModel):
    pending_orders: list[PendingOrder]
    conflict_matrix: Optional[list[list[int]]] = None  # computed if not provided


class SchedulerComparison(BaseModel):
    classical_slots: int  # e.g. sequential = N orders = N slots
    classical_conflicts_remaining: int
    quantum_slots: int
    quantum_conflicts_remaining: int  # 0
    slots_reduction_pct: float  # (classical - quantum) / classical * 100
    winner: str


class SchedulerResponse(BaseModel):
    schedule: dict[str, list[str]]  # slot_id -> order_ids
    total_slots: int
    conflict_reduction: str
    conflict_matrix: Optional[list[list[int]]] = None  # for heatmap
    total_conflicts: int = 0
    comparison: Optional[SchedulerComparison] = None
    quantum_metrics: Optional[dict] = None  # graph_nodes, graph_edges, coloring_ms, conflict_pairs


# --- Liquidation ---


class PositionToLiquidate(BaseModel):
    position_id: str
    collateral: list[str]
    debt: list[str]
    health_factor: float
    liquidation_bonus: float = 0.1
    gas_estimate: Optional[int] = None  # Gas to liquidate this position
    debt_amounts: Optional[dict[str, float]] = None  # e.g. {"USDC": 5000} for liquidity check


class LiquidationRequest(BaseModel):
    positions_to_liquidate: list[PositionToLiquidate]
    available_liquidity: Optional[dict[str, float]] = None  # e.g. {"USDC": 100000, "USDT": 50000}
    protocol_constraints: Optional[dict] = None  # max_gas_per_block, etc.


class LiquidationComparison(BaseModel):
    classical_recovery: float
    classical_selected: list[str]
    classical_gas_used: Optional[int] = None
    classical_constraint_violation: Optional[str] = None  # e.g. "gas exceeded" if classical would exceed
    quantum_recovery: float
    quantum_selected: list[str]
    quantum_gas_used: Optional[int] = None
    improvement_pct: float
    winner: str


class LiquidationResponse(BaseModel):
    selected_positions: list[str]
    strategy: list[dict]  # e.g. [{"position": "pos_1", "action": "liquidate", "priority": 1}]
    estimated_recovery: float
    simulation_time: float
    comparison: Optional[LiquidationComparison] = None
    quantum_metrics: Optional[dict] = None  # positions_evaluated, constraints_checked, solver_ms


# --- Quantum Vision: Yield Infra & Prediction Market ---


class YieldTxRef(BaseModel):
    tx_id: str
    gas_estimate: Optional[int] = None
    protocol: Optional[str] = None


class YieldSchedulingRequest(BaseModel):
    transactions: list[YieldTxRef]
    gas_limit: Optional[int] = 500_000
    gas_per_tx: Optional[int] = 80_000


class YieldSchedulingComparison(BaseModel):
    classical_total_gas: int
    classical_txs_executed: int
    quantum_total_gas: int
    quantum_txs_executed: int
    gas_savings_pct: float
    winner: str


class YieldSchedulingResponse(BaseModel):
    recommended_batches: dict[str, list[str]]  # batch_id -> list of tx_ids
    total_gas_used: int
    txs_batched: int
    simulation_time: float
    comparison: Optional[YieldSchedulingComparison] = None
    quantum_metrics: Optional[dict] = None


class PoolRiskInput(BaseModel):
    pool_id: str
    volatility: Optional[float] = 0.5
    tvl_usd: Optional[float] = 1_000_000
    concentration: Optional[float] = None
    audit_score: Optional[float] = None


class PoolRiskRequest(BaseModel):
    pools: list[PoolRiskInput]


class PoolRiskComparison(BaseModel):
    classical_avg_score: float
    quantum_avg_score: float
    factors_classical: int
    factors_quantum: int
    winner: str


class PoolRiskScore(BaseModel):
    pool_id: str
    classical_score: float
    quantum_score: float
    risk_band: str  # low, medium, high


class PoolRiskResponse(BaseModel):
    pool_scores: list[PoolRiskScore]
    simulation_time: float
    comparison: Optional[PoolRiskComparison] = None
    quantum_metrics: Optional[dict] = None


class PredictionMarketRequest(BaseModel):
    outcomes: Optional[list[str]] = None  # e.g. ["Yes", "No"]
    liquidity: Optional[float] = 10_000
    bet_amount: Optional[float] = 500


class PredictionMarketComparison(BaseModel):
    classical_slippage_pct: float
    quantum_slippage_pct: float
    slippage_reduction_pct: float
    winner: str


class PredictionMarketResponse(BaseModel):
    recommended_curve_params: dict
    execution_price: float
    slippage_pct: float
    simulation_time: float
    comparison: Optional[PredictionMarketComparison] = None
    quantum_metrics: Optional[dict] = None


# --- MemeQubit: Sniper, Batch Exit, Hedge Finder ---


class PoolCandidate(BaseModel):
    """Pump.fun-style pool candidate for sniper ranking."""
    pool_id: str
    bond_curve_funding_velocity: float  # SOL/sec or similar
    unique_wallets_ratio: float  # 0..1
    created_at_sec_ago: float
    dev_wallet_active: bool = False


class SniperRequest(BaseModel):
    candidates: list[PoolCandidate]


class SniperRankEntry(BaseModel):
    pool_id: str
    classical_score: float
    classical_rank: int
    quantum_score: float
    quantum_rank: int
    fly: bool  # recommended to enter


class SniperComparison(BaseModel):
    classical_ranking: list[str]  # pool_ids in order
    quantum_ranking: list[str]
    classical_time_ms: float
    quantum_time_ms: float
    factors_classical: int
    factors_quantum: int
    winner: str


class SniperResponse(BaseModel):
    ranking: list[SniperRankEntry]
    comparison: Optional[SniperComparison] = None
    simulation_time: float
    quantum_metrics: Optional[dict] = None


class BatchExitRequest(BaseModel):
    position_tokens: float = 1000.0
    max_slippage_pct: float = 5.0
    gas_per_tx: int = 150_000


class BatchExitComparison(BaseModel):
    classical_txs: int  # 1 = single dump
    classical_est_slippage_pct: float
    classical_est_gas: int
    quantum_batches: int
    quantum_est_slippage_pct: float
    quantum_est_gas: int
    slippage_reduction_pct: float
    gas_increase_pct: float  # quantum may use more gas (more txs) but less slippage
    winner: str


class BatchExitResponse(BaseModel):
    recommended_batches: list[dict]  # e.g. [{"batch": 1, "amount": 200, "slot": 1}, ...]
    comparison: Optional[BatchExitComparison] = None
    simulation_time: float
    quantum_metrics: Optional[dict] = None


class HedgeFinderRequest(BaseModel):
    token_to_hedge: str  # e.g. WIF address or symbol
    pools: list[PoolInput]  # meme + stables
    target_stable: Optional[str] = None  # e.g. USDC; if None, find best path to any stable


class HedgeFinderComparison(BaseModel):
    classical_path: list[str]
    classical_output: float
    classical_time_ms: float
    quantum_path: list[str]
    quantum_output: float
    quantum_time_ms: float
    improvement_pct: float
    winner: str


class HedgeFinderResponse(BaseModel):
    optimal_path: list[str]
    expected_output: float
    comparison: Optional[HedgeFinderComparison] = None
    simulation_time: float
    quantum_metrics: Optional[dict] = None
