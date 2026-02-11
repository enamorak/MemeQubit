"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Layers, Cpu, Zap } from "lucide-react";
import {
  runBatchExit,
  type BatchExitResponse,
} from "@/lib/api";

export default function BatchExitDemoPage() {
  const [positionTokens, setPositionTokens] = useState(1000);
  const [maxSlippage, setMaxSlippage] = useState(5);
  const [result, setResult] = useState<BatchExitResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runBatchExit({
        position_tokens: positionTokens,
        max_slippage_pct: maxSlippage,
        gas_per_tx: 150_000,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch exit failed");
    } finally {
      setRunning(false);
    }
  }, [positionTokens, maxSlippage]);

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white flex items-center gap-2">
          <Layers className="h-8 w-8 text-cyan-400" />
          Quantum Batching — Optimal Exit
        </h1>
        <p className="mb-8 text-slate-400 max-w-3xl">
          Selling a large meme position in one go causes high slippage. Classical approach: one transaction (fast but costly).
          Quantum approach: split the order into N batches across blocks to minimize price impact. Below we compare
          estimated slippage and gas for the same position size on test parameters.
        </p>

        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6 max-w-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Parameters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Position size (tokens)</label>
              <input
                type="number"
                value={positionTokens}
                onChange={(e) => setPositionTokens(Number(e.target.value) || 1000)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max slippage %</label>
              <input
                type="number"
                step={0.5}
                value={maxSlippage}
                onChange={(e) => setMaxSlippage(Number(e.target.value) || 5)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {running ? "Running…" : "Run Classical vs Quantum"}
          </button>
        </div>

        {error && <p className="mb-4 text-red-400">{error}</p>}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {result.comparison && (
              <div className="rounded-xl border border-slate-600 bg-slate-800/40 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Comparison: Classical vs Quantum</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-slate-300">
                      <Cpu className="h-5 w-5" />
                      <span>Classical (1 tx)</span>
                    </div>
                    <p className="text-slate-300">Transactions: {result.comparison.classical_txs}</p>
                    <p className="text-slate-400">Est. slippage: {result.comparison.classical_est_slippage_pct.toFixed(2)}%</p>
                    <p className="text-slate-400">Est. gas: {result.comparison.classical_est_gas.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-cyan-500/50 bg-slate-900/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-cyan-400">
                      <Zap className="h-5 w-5" />
                      <span>Quantum (batches)</span>
                    </div>
                    <p className="text-slate-300">Batches: {result.comparison.quantum_batches}</p>
                    <p className="text-slate-400">Est. slippage: {result.comparison.quantum_est_slippage_pct.toFixed(2)}%</p>
                    <p className="text-slate-400">Est. gas: {result.comparison.quantum_est_gas.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="text-cyan-400">Slippage reduction: {result.comparison.slippage_reduction_pct.toFixed(1)}%</span>
                  <span className="text-slate-400">Gas change: {result.comparison.gas_increase_pct.toFixed(1)}%</span>
                </div>
                <p className="mt-4 text-white">
                  Winner: <span className={result.comparison.winner === "quantum" ? "text-cyan-400" : "text-amber-400"}>{result.comparison.winner}</span>
                </p>
              </div>
            )}

            <div className="rounded-xl border border-slate-600 bg-slate-800/40 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Recommended batch schedule (Quantum)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-600">
                      <th className="pb-2 pr-4">Batch</th>
                      <th className="pb-2 pr-4">Amount (tokens)</th>
                      <th className="pb-2">Slot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.recommended_batches.map((b) => (
                      <tr key={b.batch} className="border-b border-slate-700/50">
                        <td className="py-2 pr-4">{b.batch}</td>
                        <td className="py-2 pr-4">{b.amount}</td>
                        <td className="py-2">{b.slot}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-slate-500">Simulation time: {result.simulation_time} ms</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
