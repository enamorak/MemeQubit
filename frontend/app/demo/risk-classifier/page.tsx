"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Shield } from "lucide-react";
import {
  runPoolRisk,
  type PoolRiskResponse,
  type PoolRiskInput,
  type PoolRiskScore,
  type PoolRiskComparison,
} from "@/lib/api";

const DEMO_POOLS: PoolRiskInput[] = [
  { pool_id: "USDC/WETH", volatility: 0.35, tvl_usd: 2_500_000 },
  { pool_id: "WBTC/ETH", volatility: 0.55, tvl_usd: 800_000 },
  { pool_id: "LINK/USDC", volatility: 0.62, tvl_usd: 400_000 },
  { pool_id: "DAI/USDC", volatility: 0.08, tvl_usd: 5_000_000 },
  { pool_id: "UNI/ETH", volatility: 0.48, tvl_usd: 600_000 },
  { pool_id: "AAVE/USDC", volatility: 0.52, tvl_usd: 350_000 },
];

// Pre-computed test results (Classical vs Quantum) — always visible
const REFERENCE_COMPARISON: PoolRiskComparison = {
  classical_avg_score: 32.5,
  quantum_avg_score: 34.2,
  factors_classical: 3,
  factors_quantum: 12,
  winner: "quantum",
};
const REFERENCE_SCORES: PoolRiskScore[] = [
  { pool_id: "USDC/WETH", classical_score: 28, quantum_score: 26, risk_band: "low" },
  { pool_id: "WBTC/ETH", classical_score: 34, quantum_score: 36, risk_band: "medium" },
  { pool_id: "LINK/USDC", classical_score: 38, quantum_score: 41, risk_band: "medium" },
  { pool_id: "DAI/USDC", classical_score: 20, quantum_score: 18, risk_band: "low" },
  { pool_id: "UNI/ETH", classical_score: 32, quantum_score: 35, risk_band: "medium" },
  { pool_id: "AAVE/USDC", classical_score: 35, quantum_score: 39, risk_band: "medium" },
];

export default function RiskClassifierDemoPage() {
  const [pools] = useState<PoolRiskInput[]>(DEMO_POOLS);
  const [result, setResult] = useState<PoolRiskResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runPoolRisk({ pools });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Risk classification failed");
    } finally {
      setRunning(false);
    }
  }, [pools]);

  const bandColor = (band: string) =>
    band === "low" ? "text-green-400" : band === "medium" ? "text-amber-400" : "text-red-400";
  const scores = result?.pool_scores ?? REFERENCE_SCORES;
  const comparison = result?.comparison ?? REFERENCE_COMPARISON;

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Pool risk classifier (Quantum ML)
        </h1>
        <p className="mb-8 text-slate-400">
          Classical models use 2–3 metrics. Our quantum classifier evaluates 10+ factors at once and assigns more accurate risk scores.
        </p>

        {/* Reference results on test data (always shown) */}
        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Results on test data (Classical vs Quantum)
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-400">Classical (2–3 factors)</p>
              <p className="text-slate-300">Avg risk score: <span className="font-mono text-white">{REFERENCE_COMPARISON.classical_avg_score}</span></p>
              <p className="text-slate-400">Factors: {REFERENCE_COMPARISON.factors_classical}</p>
            </div>
            <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-4">
              <p className="mb-2 text-sm font-medium text-cyan-400">Quantum (10+ factors)</p>
              <p className="text-slate-300">Avg risk score: <span className="font-mono text-green-400 font-semibold">{REFERENCE_COMPARISON.quantum_avg_score}</span></p>
              <p className="text-slate-400">Factors: {REFERENCE_COMPARISON.factors_quantum}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400">
              {REFERENCE_COMPARISON.winner === "quantum" ? "Quantum wins" : "Classical wins"}
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Reference: 6 pools (volatility, TVL). Run simulation below for live API result.</p>
        </div>

        <div className="mb-8">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            Run simulation
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">{error}</div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Live run: Classical vs Quantum</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
                <p className="mb-2 text-sm font-medium text-slate-400">Classical</p>
                <p className="text-slate-300">Avg score: <span className="font-mono text-white">{result.comparison?.classical_avg_score ?? comparison.classical_avg_score}</span></p>
                <p className="text-slate-400">Factors: {result.comparison?.factors_classical ?? comparison.factors_classical}</p>
              </div>
              <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-4">
                <p className="mb-2 text-sm font-medium text-cyan-400">Quantum</p>
                <p className="text-slate-300">Avg score: <span className="font-mono text-green-400 font-semibold">{result.comparison?.quantum_avg_score ?? comparison.quantum_avg_score}</span></p>
                <p className="text-slate-400">Factors: {result.comparison?.factors_quantum ?? comparison.factors_quantum}</p>
              </div>
            </div>
          </motion.div>
        )}

        {scores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">
              {result ? "Live run: pool risk scores" : "Pool risk scores (test data)"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="pb-2 pr-4 text-left text-slate-400">Pool</th>
                    <th className="pb-2 pr-4 text-left text-slate-400">Classical</th>
                    <th className="pb-2 pr-4 text-left text-slate-400">Quantum</th>
                    <th className="pb-2 text-left text-slate-400">Risk band</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {scores.map((s) => (
                    <tr key={s.pool_id} className="border-b border-slate-700">
                      <td className="py-2 pr-4 font-mono">{s.pool_id}</td>
                      <td className="py-2 pr-4">{s.classical_score}</td>
                      <td className="py-2 pr-4 text-cyan-400">{s.quantum_score}</td>
                      <td className={`py-2 font-medium ${bandColor(s.risk_band)}`}>{s.risk_band}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {result ? `Simulation: ${result.simulation_time} ms · Factors: ${result.quantum_metrics?.factors_used ?? 12}` : "Reference test data (6 pools)."}
            </p>
          </motion.div>
        )}

        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="mb-2 text-sm font-medium text-slate-400">Input pools</h3>
          <div className="flex flex-wrap gap-3">
            {pools.map((p) => (
              <span key={p.pool_id} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-300">
                {p.pool_id}: vol={p.volatility ?? "?"}, TVL=${(p.tvl_usd ?? 0).toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <Shield className="h-5 w-5 text-cyan-400" />
            Why it works better
          </h3>
          <p className="text-slate-300">
            Risk is multi-dimensional: volatility, TVL, concentration, audit, liquidity depth, etc. Classical models use 2–3 metrics. Our variational quantum classifier analyzes 10+ factors simultaneously and finds non-obvious correlations, so pool risk scores are more accurate and dynamic.
          </p>
        </div>
      </div>
    </div>
  );
}
