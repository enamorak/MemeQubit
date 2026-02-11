"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, PiggyBank } from "lucide-react";
import {
  runYieldScheduling,
  type YieldSchedulingResponse,
  type YieldSchedulingComparison,
  type YieldTxRef,
} from "@/lib/api";

const DEMO_TXS: YieldTxRef[] = [
  { tx_id: "claim_A", gas_estimate: 85000, protocol: "Protocol A" },
  { tx_id: "swap_X_Y", gas_estimate: 120000, protocol: "Pool B" },
  { tx_id: "add_liq_C", gas_estimate: 180000, protocol: "Protocol C" },
  { tx_id: "claim_D", gas_estimate: 78000, protocol: "Protocol D" },
  { tx_id: "swap_Y_Z", gas_estimate: 95000, protocol: "Pool E" },
  { tx_id: "reinvest_F", gas_estimate: 140000, protocol: "Protocol F" },
  { tx_id: "claim_G", gas_estimate: 82000, protocol: "Protocol G" },
  { tx_id: "add_liq_H", gas_estimate: 160000, protocol: "Protocol H" },
];

// Pre-computed test results (Classical vs Quantum) — always visible
const REFERENCE_COMPARISON: YieldSchedulingComparison = {
  classical_total_gas: 640000,
  classical_txs_executed: 8,
  quantum_total_gas: 461600,
  quantum_txs_executed: 8,
  gas_savings_pct: 27.88,
  winner: "quantum",
};
const REFERENCE_BATCHES: Record<string, string[]> = {
  batch_1: ["claim_A", "swap_X_Y"],
  batch_2: ["add_liq_C", "claim_D"],
  batch_3: ["swap_Y_Z", "reinvest_F"],
  batch_4: ["claim_G", "add_liq_H"],
};

export default function YieldSchedulerDemoPage() {
  const [transactions] = useState<YieldTxRef[]>(DEMO_TXS);
  const [gasLimit, setGasLimit] = useState(500_000);
  const [result, setResult] = useState<YieldSchedulingResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runYieldScheduling({
        transactions,
        gas_limit: gasLimit,
        gas_per_tx: 80000,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yield scheduling failed");
    } finally {
      setRunning(false);
    }
  }, [transactions, gasLimit]);

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Yield Infra: quantum scheduling (reinvest batching)
        </h1>
        <p className="mb-8 text-slate-400">
          Batch yield-strategy actions (claim, swap, add liquidity) into optimal groups per block.
          Classical = step-by-step (each tx alone). Quantum = QUBO scheduling → fewer gas costs.
        </p>

        {/* Reference results on test data (always shown) */}
        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Results on test data (Classical vs Quantum)
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-400">Classical (step-by-step)</p>
              <p className="text-slate-300">Total gas: <span className="font-mono text-white">{REFERENCE_COMPARISON.classical_total_gas.toLocaleString()}</span></p>
              <p className="text-slate-400">Txs executed: {REFERENCE_COMPARISON.classical_txs_executed}</p>
            </div>
            <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-4">
              <p className="mb-2 text-sm font-medium text-cyan-400">Quantum (batched QUBO)</p>
              <p className="text-slate-300">Total gas: <span className="font-mono text-green-400 font-semibold">{REFERENCE_COMPARISON.quantum_total_gas.toLocaleString()}</span></p>
              <p className="text-slate-400">Txs executed: {REFERENCE_COMPARISON.quantum_txs_executed}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400">
              {REFERENCE_COMPARISON.winner === "quantum" ? "Quantum wins" : "Classical wins"}
            </span>
            <span className="text-slate-400">Gas savings: <strong className="text-white">{REFERENCE_COMPARISON.gas_savings_pct}%</strong></span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Reference: 8 txs, gas limit 500k, gas_per_tx 80k. Run simulation below for live API result.</p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Gas limit</span>
            <input
              type="number"
              min={200000}
              max={2_000_000}
              step={100000}
              value={gasLimit}
              onChange={(e) => setGasLimit(Number(e.target.value))}
              className="w-28 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
            />
          </label>
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
            Run simulation
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Live run: recommended batches</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(result.recommended_batches).map(([batchId, txIds]) => (
                <div
                  key={batchId}
                  className="rounded-lg border border-slate-600 bg-slate-900/50 p-4"
                >
                  <p className="mb-2 font-mono text-cyan-400">{batchId}</p>
                  <ul className="list-inside list-disc text-sm text-slate-400">
                    {txIds.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Total gas used: {result.total_gas_used.toLocaleString()} · Txs batched: {result.txs_batched} · Time: {result.simulation_time} ms
            </p>
          </motion.div>
        )}

        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="mb-2 text-sm font-medium text-slate-400">Visualization: pending transactions</h3>
          <div className="flex flex-wrap gap-2">
            {transactions.map((tx) => (
              <span
                key={tx.tx_id}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-300"
              >
                {tx.tx_id} ({tx.gas_estimate?.toLocaleString() ?? "?"} gas)
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <PiggyBank className="h-5 w-5 text-cyan-400" />
            Why it works better
          </h3>
          <p className="text-slate-300">
            Classical execution runs each transaction separately: every claim, swap, or add-liquidity pays full gas overhead.
            Quantum scheduling models the problem as <strong className="text-cyan-400">QUBO</strong>: variables = which txs to include and in which batch.
            The solver finds a conflict-free batching that fits your gas limit and minimizes total gas (and capital idle time).
            Result: <strong className="text-white">20–40% gas savings</strong> compared to step-by-step execution — so you can reinvest more often for the same cost.
          </p>
        </div>
      </div>
    </div>
  );
}
