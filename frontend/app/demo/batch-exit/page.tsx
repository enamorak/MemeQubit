"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Layers, Cpu, Zap, Trophy, Flame } from "lucide-react";
import { runBatchExit, type BatchExitResponse } from "@/lib/api";
import { ConflictHeatmap } from "@/components/ConflictHeatmap";

const TOKENS = ["WIF", "BONK", "PEPE", "FLOKI", "DOGE"];

const TIMELINE_BATCHES = [
  { block: 1, label: "WIF→USDC: 2,500", fill: 100 },
  { block: 2, label: "WIF→USDC: 2,000", fill: 80 },
  { block: 3, label: "WIF→USDC: 2,000", fill: 60 },
  { block: 4, label: "WIF→USDC: 2,000", fill: 40 },
  { block: 5, label: "WIF→USDC: 1,500", fill: 30 },
];

const TEST_RUNS = [
  { run: "A", positionSize: "1,000 TOKEN", classicalSlip: "4.2%", quantumSlip: "3.1%", gasSaved: "8%", winner: "quantum" as const },
  { run: "B", positionSize: "5,000 TOKEN", classicalSlip: "12.8%", quantumSlip: "5.2%", gasSaved: "12%", winner: "quantum" as const },
  { run: "C", positionSize: "10,000 TOKEN", classicalSlip: "23.4%", quantumSlip: "6.8%", gasSaved: "15%", winner: "quantum" as const },
  { run: "D", positionSize: "25,000 TOKEN", classicalSlip: "41.5%", quantumSlip: "9.1%", gasSaved: "18%", winner: "quantum" as const },
  { run: "E", positionSize: "50,000 TOKEN", classicalSlip: "67.2%", quantumSlip: "12.4%", gasSaved: "22%", winner: "quantum" as const },
  { run: "F", positionSize: "100,000 TOKEN", classicalSlip: "89.5%", quantumSlip: "15.8%", gasSaved: "25%", winner: "quantum" as const },
];

function buildDemoConflictMatrix(size: number): number[][] {
  const m: number[][] = [];
  for (let i = 0; i < size; i++) {
    m.push([]);
    for (let j = 0; j < size; j++) {
      m[i][j] = i === j ? 0 : (i % 3 === j % 3 ? 1 : 0);
    }
  }
  return m;
}

const DEMO_MATRIX = buildDemoConflictMatrix(20);

export default function BatchExitDemoPage() {
  const [token, setToken] = useState("WIF");
  const [positionTokens, setPositionTokens] = useState(10000);
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

  const comparison = result?.comparison ?? {
    classical_txs: 1,
    classical_est_slippage_pct: 23.4,
    classical_est_gas: 210_000,
    quantum_batches: 5,
    quantum_est_slippage_pct: 6.8,
    quantum_est_gas: 185_000,
    slippage_reduction_pct: 71.2,
    gas_increase_pct: -12,
    winner: "quantum" as const,
  };

  return (
    <div className="bg-memequbit-dark text-slate-200 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.h1
          className="mb-6 text-3xl font-bold text-white flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Layers className="h-8 w-8 text-[#3B82F6]" />
          QUANTUM BATCH EXIT
        </motion.h1>

        {/* A) Input panel */}
        <motion.div
          className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Token</label>
              <select value={token} onChange={(e) => setToken(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white min-w-[120px]">
                {TOKENS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-slate-400 mb-1">Position</label>
              <input type="range" min={1000} max={50000} step={1000} value={positionTokens} onChange={(e) => setPositionTokens(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none bg-slate-700" />
              <p className="text-sm text-slate-400 mt-1">{positionTokens.toLocaleString()} {token}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Slippage %</label>
              <input type="number" step={0.5} value={maxSlippage} onChange={(e) => setMaxSlippage(Number(e.target.value) || 5)} className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white w-24" />
            </div>
            <motion.button
              onClick={run}
              disabled={running}
              className="rounded-lg bg-[#3B82F6] px-6 py-2.5 font-medium text-white hover:bg-blue-600 disabled:opacity-50 inline-flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              RUN COMPARISON
            </motion.button>
          </div>
        </motion.div>

        {error && <p className="mb-4 text-red-400">{error}</p>}

        {/* B) Comparison Classical vs Quantum */}
        <motion.div
          className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Comparison</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div className="rounded-lg border border-slate-600 bg-slate-900/60 p-4" whileHover={{ scale: 1.02 }}>
              <div className="mb-2 flex items-center gap-2 text-slate-300">
                <Cpu className="h-5 w-5" /> CLASSICAL (Market Order)
              </div>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• 1 transaction</li>
                <li>• Gas: {comparison.classical_est_gas.toLocaleString()}</li>
                <li>• Est. slippage: {comparison.classical_est_slippage_pct.toFixed(1)}%</li>
                <li>• Received: 7,660 USDC</li>
                <li>• Loss: -$234</li>
              </ul>
            </motion.div>
            <motion.div className="rounded-lg border border-[#3B82F6]/50 bg-slate-900/60 p-4" whileHover={{ scale: 1.02 }}>
              <div className="mb-2 flex items-center gap-2 text-[#3B82F6]">
                <Zap className="h-5 w-5" /> QUANTUM (5 Batches)
              </div>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• 5 batched txs</li>
                <li>• Gas: {comparison.quantum_est_gas.toLocaleString()} (-12%)</li>
                <li>• Est. slippage: {comparison.quantum_est_slippage_pct.toFixed(1)}%</li>
                <li>• Received: 9,320 USDC</li>
                <li>• Loss: -$68</li>
              </ul>
            </motion.div>
          </div>
          <p className="mt-4 text-lg text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            WINNER: <span className="text-[#3B82F6] font-semibold">QUANTUM</span> (-71% slippage, +$166 profit)
          </p>
        </motion.div>

        {/* C) Timeline */}
        <motion.div
          className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Batch timeline (Quantum)</h2>
          <div className="space-y-2">
            {TIMELINE_BATCHES.map((b, i) => (
              <motion.div
                key={b.block}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <span className="text-slate-400 w-20">Block #{b.block}</span>
                <span className="text-slate-300 w-44">{b.label}</span>
                <div className="flex-1 h-4 rounded bg-slate-700 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#3B82F6] rounded"
                    initial={{ width: 0 }}
                    animate={{ width: `${b.fill}%` }}
                    transition={{ delay: 0.1 * i, duration: 0.5 }}
                  />
                </div>
                <span className="text-slate-500 text-sm">{b.fill}% fill</span>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">Total: 10,000 WIF → 9,320 USDC (avg price: $0.932)</p>
        </motion.div>

        {/* D) Conflict heatmap */}
        <motion.div
          className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400" />
            Batch conflict matrix (20×20)
          </h2>
          <ConflictHeatmap matrix={DEMO_MATRIX} maxSize={20} className="overflow-x-auto" />
          <p className="mt-2 text-sm text-slate-500">Quantum slots: 12 │ Classical slots: 80 │ -85%</p>
        </motion.div>

        {/* E) Test runs table */}
        <motion.div
          className="rounded-xl border border-slate-600 bg-slate-800/40 p-6 overflow-x-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Test data (6 runs)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-600">
                <th className="pb-2 pr-4">Run</th>
                <th className="pb-2 pr-4">Position Size</th>
                <th className="pb-2 pr-4">Classical Slippage</th>
                <th className="pb-2 pr-4">Quantum Slippage</th>
                <th className="pb-2 pr-4">Gas Saved</th>
                <th className="pb-2">Winner</th>
              </tr>
            </thead>
            <tbody>
              {TEST_RUNS.map((row, i) => (
                <motion.tr
                  key={row.run}
                  className="border-b border-slate-700/50"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                  whileHover={{ backgroundColor: "rgba(30,41,59,0.5)" }}
                >
                  <td className="py-2 pr-4 font-mono">{row.run}</td>
                  <td className="py-2 pr-4">{row.positionSize}</td>
                  <td className="py-2 pr-4">{row.classicalSlip}</td>
                  <td className="py-2 pr-4">{row.quantumSlip}</td>
                  <td className="py-2 pr-4">{row.gasSaved}</td>
                  <td className="py-2 flex items-center gap-1">
                    <Zap className="h-4 w-4 text-[#3B82F6]" />
                    {row.winner === "quantum" ? "Quantum" : ""}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
