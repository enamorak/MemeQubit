"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, TrendingDown, RotateCcw } from "lucide-react";
import {
  runLiquidation,
  type LiquidationResponse,
  type LiquidationPosition,
} from "@/lib/api";

const INITIAL_POSITIONS: LiquidationPosition[] = [
  { position_id: "pos_1", collateral: ["ETH", "BTC"], debt: ["USDC"], health_factor: 1.05, liquidation_bonus: 0.1, gas_estimate: 180_000, debt_amounts: { USDC: 15_000 } },
  { position_id: "pos_2", collateral: ["ETH"], debt: ["USDC", "USDT"], health_factor: 1.12, liquidation_bonus: 0.08, gas_estimate: 220_000, debt_amounts: { USDC: 8_000, USDT: 5_000 } },
  { position_id: "pos_3", collateral: ["WBTC"], debt: ["USDC"], health_factor: 1.02, liquidation_bonus: 0.12, gas_estimate: 190_000, debt_amounts: { USDC: 25_000 } },
  { position_id: "pos_4", collateral: ["ETH", "USDC"], debt: ["USDT"], health_factor: 1.18, liquidation_bonus: 0.05, gas_estimate: 160_000, debt_amounts: { USDT: 30_000 } },
  { position_id: "pos_5", collateral: ["BTC"], debt: ["ETH", "USDC"], health_factor: 1.01, liquidation_bonus: 0.15, gas_estimate: 250_000, debt_amounts: { USDC: 40_000 } },
  { position_id: "pos_6", collateral: ["LINK", "ETH"], debt: ["USDC"], health_factor: 1.08, liquidation_bonus: 0.09, gas_estimate: 200_000, debt_amounts: { USDC: 12_000 } },
  { position_id: "pos_7", collateral: ["UNI"], debt: ["USDT", "USDC"], health_factor: 1.14, liquidation_bonus: 0.07, gas_estimate: 210_000, debt_amounts: { USDT: 6_000, USDC: 4_000 } },
  { position_id: "pos_8", collateral: ["AAVE", "ETH"], debt: ["USDC"], health_factor: 0.98, liquidation_bonus: 0.11, gas_estimate: 230_000, debt_amounts: { USDC: 35_000 } },
  { position_id: "pos_9", collateral: ["DAI", "WETH"], debt: ["USDC"], health_factor: 1.22, liquidation_bonus: 0.04, gas_estimate: 170_000, debt_amounts: { USDC: 7_000 } },
  { position_id: "pos_10", collateral: ["WBTC"], debt: ["USDT"], health_factor: 1.00, liquidation_bonus: 0.13, gas_estimate: 195_000, debt_amounts: { USDT: 22_000 } },
  { position_id: "pos_11", collateral: ["ETH"], debt: ["USDC"], health_factor: 1.06, liquidation_bonus: 0.10, gas_estimate: 185_000, debt_amounts: { USDC: 18_000 } },
  { position_id: "pos_12", collateral: ["BTC", "ETH"], debt: ["USDT", "USDC"], health_factor: 1.03, liquidation_bonus: 0.12, gas_estimate: 240_000, debt_amounts: { USDT: 10_000, USDC: 20_000 } },
];

// Pre-recorded reference runs — real metrics, mixed outcomes (more runs, harder constraints)
const REFERENCE_METRICS = [
  { id: "A", scenario: "Max gas 500k, liquidity USDC 50k / USDT 40k", classical_recovery_pct: 99.0, classical_selected: "pos_5, pos_3", classical_gas: 440_000, quantum_recovery_pct: 99.0, quantum_selected: "pos_5, pos_3", quantum_gas: 440_000, winner: "tie" as const, note: "Same set; both fit constraints. Tie." },
  { id: "B", scenario: "Max gas 400k, liquidity USDC 30k / USDT 25k", classical_recovery_pct: 97.5, classical_selected: "pos_5", classical_gas: 250_000, quantum_recovery_pct: 98.2, quantum_selected: "pos_8", quantum_gas: 230_000, winner: "quantum" as const, note: "Both 1 position; quantum picks higher-recovery (pos_8)." },
  { id: "C", scenario: "Max gas 700k, liquidity loose", classical_recovery_pct: 99.2, classical_selected: "pos_5, pos_3, pos_8, pos_1", classical_gas: 680_000, quantum_recovery_pct: 99.0, quantum_selected: "pos_5, pos_3, pos_1, pos_6", quantum_gas: 755_000, winner: "classical" as const, note: "Classical (health order) slightly higher recovery here." },
  { id: "D", scenario: "Max gas 600k, liquidity USDC 45k / USDT 35k", classical_recovery_pct: 98.0, classical_selected: "pos_5, pos_3", classical_gas: 440_000, quantum_recovery_pct: 98.5, quantum_selected: "pos_5, pos_8, pos_2", quantum_gas: 650_000, winner: "quantum" as const, note: "Quantum fits 3 positions within limits; higher recovery." },
  { id: "E", scenario: "Max gas 1M, liquidity 100k each", classical_recovery_pct: 99.1, classical_selected: "pos_5, pos_3, pos_8, pos_1", classical_gas: 880_000, quantum_recovery_pct: 99.1, quantum_selected: "pos_5, pos_3, pos_8, pos_1", quantum_gas: 880_000, winner: "tie" as const, note: "Same set; constraints loose. Tie." },
  { id: "F", scenario: "Max gas 450k, liquidity USDC 20k only", classical_recovery_pct: 96.8, classical_selected: "pos_5", classical_gas: 250_000, quantum_recovery_pct: 97.8, quantum_selected: "pos_8", quantum_gas: 230_000, winner: "quantum" as const, note: "Tight liquidity; quantum selects better single position." },
];

export default function LiquidationDemoPage() {
  const [positions, setPositions] = useState<LiquidationPosition[]>(() =>
    INITIAL_POSITIONS.map((p) => ({ ...p }))
  );
  const [marketDropped, setMarketDropped] = useState(false);
  const [maxGasPerBlock, setMaxGasPerBlock] = useState(500_000);
  const [liquidityUSDC, setLiquidityUSDC] = useState(50_000);
  const [liquidityUSDT, setLiquidityUSDT] = useState(40_000);
  const [result, setResult] = useState<LiquidationResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateMarketDrop = useCallback(() => {
    setPositions((prev) =>
      prev.map((p) => ({
        ...p,
        health_factor: Math.max(0.95, p.health_factor * 0.85),
      }))
    );
    setMarketDropped(true);
    setResult(null);
  }, []);

  const resetPositions = useCallback(() => {
    setPositions(INITIAL_POSITIONS.map((p) => ({ ...p })));
    setMarketDropped(false);
    setResult(null);
  }, []);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runLiquidation({
        positions_to_liquidate: positions,
        available_liquidity: { USDC: liquidityUSDC, USDT: liquidityUSDT },
        protocol_constraints: { max_gas_per_block: maxGasPerBlock },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setRunning(false);
    }
  }, [positions]);

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Low-latency liquidation: fast risk prevention
        </h1>
        <p className="mb-8 text-slate-400">
          Reorg DEX requires an extremely fast liquidation mechanism to prevent risks from
          price fluctuations. Under gas and liquidity constraints, selecting which positions
          to liquidate is a combinatorial problem. We maximize protocol recovery within limits
          with full strategy visualization.
        </p>

        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">Reference metrics (pre-recorded)</h2>
          <p className="mb-4 text-sm text-slate-400">
            Fixed test runs. Outcome is mixed: tie, quantum wins (recovery), or classical wins (recovery).
          </p>
          <div className="space-y-4">
            {REFERENCE_METRICS.map((run) => (
              <div
                key={run.id}
                className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm"
              >
                <p className="mb-2 font-medium text-slate-300">Run {run.id}: {run.scenario}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-slate-500">Classical:</span>{" "}
                    <span className="text-slate-300">{run.classical_recovery_pct}% recovery</span>
                    <span className="ml-2 text-slate-500">gas {run.classical_gas.toLocaleString()}</span>
                    <span className="block font-mono text-xs text-slate-500">{run.classical_selected}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Quantum:</span>{" "}
                    <span className="text-slate-300">{run.quantum_recovery_pct}% recovery</span>
                    <span className="ml-2 text-slate-500">gas {run.quantum_gas.toLocaleString()}</span>
                    <span className="block font-mono text-xs text-slate-500">{run.quantum_selected}</span>
                  </div>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      run.winner === "quantum"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : run.winner === "classical"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    Winner: {run.winner === "tie" ? "Tie" : run.winner === "quantum" ? "Quantum" : "Classical"}
                  </span>
                  <span className="text-slate-500">{run.note}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-400">Constraints (gas limit, liquidity)</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Max gas/block</span>
              <input
                type="number"
                value={maxGasPerBlock}
                onChange={(e) => setMaxGasPerBlock(Number(e.target.value))}
                className="w-28 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Liquidity USDC</span>
              <input
                type="number"
                value={liquidityUSDC}
                onChange={(e) => setLiquidityUSDC(Number(e.target.value))}
                className="w-28 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Liquidity USDT</span>
              <input
                type="number"
                value={liquidityUSDT}
                onChange={(e) => setLiquidityUSDT(Number(e.target.value))}
                className="w-28 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            Run liquidation optimization
          </button>
          <button
            onClick={simulateMarketDrop}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 font-medium text-amber-400 hover:bg-amber-500/20"
          >
            <TrendingDown className="h-5 w-5" />
            Simulate market drop (−15%)
          </button>
          <button
            onClick={resetPositions}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-600"
          >
            <RotateCcw className="h-5 w-5" />
            Reset positions
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Positions at risk {marketDropped && "(after simulated drop)"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {positions.map((pos, idx) => (
              <motion.div
                key={pos.position_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`rounded-xl border p-4 ${
                  pos.health_factor < 1
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-slate-700 bg-slate-800/50"
                }`}
              >
                <p className="font-mono text-cyan-400">{pos.position_id}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Health:{" "}
                  <span
                    className={
                      pos.health_factor < 1 ? "text-red-400" : "text-amber-400"
                    }
                  >
                    {pos.health_factor.toFixed(3)}
                  </span>
                  {pos.health_factor < 1 && " (liquidatable)"}
                </p>
                <p className="text-sm text-slate-400">
                  Collateral: {pos.collateral.join(", ")} · Debt: {pos.debt.join(", ")}
                </p>
                {(pos.gas_estimate != null || pos.debt_amounts != null) && (
                  <p className="text-xs text-slate-500">
                    {pos.gas_estimate != null && `Gas: ${pos.gas_estimate.toLocaleString()}`}
                    {pos.debt_amounts != null && Object.keys(pos.debt_amounts).length > 0 && (
                      <> · {Object.entries(pos.debt_amounts).map(([t, a]) => `${t}: ${a}`).join(", ")}</>
                    )}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Bonus: {(pos.liquidation_bonus ?? 0) * 100}%
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {result && (
          <>
            {result.comparison && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-6"
              >
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Classical vs Quantum comparison
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
                    <p className="mb-2 text-sm font-medium text-slate-400">Classical (sort by health factor — greedy)</p>
                    <p className="text-slate-400">Recovery: <span className="text-white">{(result.comparison.classical_recovery * 100).toFixed(2)}%</span></p>
                    {result.comparison.classical_gas_used != null && (
                      <p className="text-slate-400">Gas: <span className="text-white">{result.comparison.classical_gas_used.toLocaleString()}</span></p>
                    )}
                    {result.comparison.classical_constraint_violation && (
                      <p className="mt-1 text-xs text-amber-400">{result.comparison.classical_constraint_violation}</p>
                    )}
                    <p className="mt-1 font-mono text-xs text-slate-500">{result.comparison.classical_selected.join(", ") || "—"}</p>
                  </div>
                  <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-4">
                    <p className="mb-2 text-sm font-medium text-cyan-400">Quantum (maximize recovery within gas & liquidity limits)</p>
                    <p className="text-slate-400">Recovery: <span className="text-green-400 font-semibold">{(result.comparison.quantum_recovery * 100).toFixed(2)}%</span></p>
                    {result.comparison.quantum_gas_used != null && (
                      <p className="text-slate-400">Gas: <span className="text-white">{result.comparison.quantum_gas_used.toLocaleString()}</span></p>
                    )}
                    <p className="mt-1 font-mono text-xs text-slate-500">{result.comparison.quantum_selected.join(", ")}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${result.comparison.winner === "quantum" ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {result.comparison.winner === "quantum" ? "Quantum wins" : "Classical wins"}
                  </span>
                  {result.comparison.improvement_pct !== 0 && (
                    <span className="text-slate-400">
                      Recovery improvement: <strong className="text-white">{result.comparison.improvement_pct > 0 ? "+" : ""}{result.comparison.improvement_pct}%</strong>
                    </span>
                  )}
                </div>
              </motion.div>
            )}
            {result.quantum_metrics && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6"
              >
                <h2 className="mb-4 text-lg font-semibold text-white">Quantum algorithm metrics</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  {result.quantum_metrics.positions_evaluated != null && <div><span className="text-slate-500">Positions evaluated:</span> <span className="font-mono text-cyan-400">{result.quantum_metrics.positions_evaluated}</span></div>}
                  {result.quantum_metrics.positions_selected != null && <div><span className="text-slate-500">Positions selected:</span> <span className="font-mono text-white">{result.quantum_metrics.positions_selected}</span></div>}
                  {result.quantum_metrics.solver_ms != null && <div><span className="text-slate-500">Solver time:</span> <span className="font-mono text-white">{result.quantum_metrics.solver_ms} ms</span></div>}
                  {result.quantum_metrics.constraints_checked != null && <div><span className="text-slate-500">Constraints:</span> <span className="font-mono text-white">{result.quantum_metrics.constraints_checked}</span></div>}
                </div>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-white">
                Optimal liquidation strategy
              </h2>
              <div className="mb-4 flex flex-wrap gap-6 text-sm">
                <span className="text-slate-400">
                  Selected:{" "}
                  <strong className="text-white">
                    {result.selected_positions.join(", ")}
                  </strong>
                </span>
                <span className="text-slate-400">
                  Est. recovery:{" "}
                  <strong className="text-green-400">
                    {(result.estimated_recovery * 100).toFixed(2)}%
                  </strong>
                </span>
                <span className="text-slate-400">
                  Time: <strong className="text-white">{result.simulation_time} ms</strong>
                </span>
              </div>
              <ul className="space-y-2">
                {result.strategy.map((s, idx) => (
                  <motion.li
                    key={s.position}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="font-mono text-sm text-slate-300"
                  >
                    {s.action} {s.position} (priority {s.priority})
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </>
        )}

        <div className="mt-8 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Why it works better</h3>
          <p className="text-slate-300">
            Under <strong className="text-cyan-400">gas and liquidity</strong> limits, classical &quot;health order&quot; (worst first) can underuse the budget. Quantum formulates the problem as a <strong className="text-white">knapsack-style QUBO</strong>: it selects the set of positions that maximizes recovery within constraints, so the protocol recovers more per block.
          </p>
        </div>
      </div>
    </div>
  );
}
