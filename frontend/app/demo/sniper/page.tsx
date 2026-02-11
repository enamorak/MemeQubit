"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Target, Cpu, Zap } from "lucide-react";
import {
  runSniper,
  type SniperResponse,
  type PoolCandidate,
} from "@/lib/api";

const DEMO_CANDIDATES: PoolCandidate[] = [
  { pool_id: "WIF_001", bond_curve_funding_velocity: 0.8, unique_wallets_ratio: 0.6, created_at_sec_ago: 45, dev_wallet_active: false },
  { pool_id: "BONK_002", bond_curve_funding_velocity: 0.3, unique_wallets_ratio: 0.5, created_at_sec_ago: 180, dev_wallet_active: true },
  { pool_id: "PEPE_003", bond_curve_funding_velocity: 1.2, unique_wallets_ratio: 0.4, created_at_sec_ago: 30, dev_wallet_active: false },
  { pool_id: "FLOKI_004", bond_curve_funding_velocity: 0.5, unique_wallets_ratio: 0.7, created_at_sec_ago: 90, dev_wallet_active: false },
  { pool_id: "MEME_005", bond_curve_funding_velocity: 0.2, unique_wallets_ratio: 0.3, created_at_sec_ago: 300, dev_wallet_active: true },
];

export default function SniperDemoPage() {
  const [result, setResult] = useState<SniperResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runSniper({ candidates: DEMO_CANDIDATES });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sniper ranking failed");
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white flex items-center gap-2">
          <Target className="h-8 w-8 text-cyan-400" />
          Quantum Sniper — Optimal Entry Timing
        </h1>
        <p className="mb-8 text-slate-400 max-w-3xl">
          Choose when to enter a new Pump.fun pool not just by speed, but by <strong>probability of success</strong>.
          Classical approach: sequential rules (IF velocity &gt; X AND uniqueness &gt; Y). Quantum approach: QUBO evaluates
          all factors (funding velocity, wallet uniqueness, freshness, dev activity) in a single weighted sum. Results below
          show side-by-side ranking and scores on the same test data.
        </p>

        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Test data: 5 Pump.fun-style pool candidates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-600">
                  <th className="pb-2 pr-4">Pool ID</th>
                  <th className="pb-2 pr-4">Funding velocity</th>
                  <th className="pb-2 pr-4">Unique wallets ratio</th>
                  <th className="pb-2 pr-4">Created (sec ago)</th>
                  <th className="pb-2">Dev active</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CANDIDATES.map((c) => (
                  <tr key={c.pool_id} className="border-b border-slate-700/50">
                    <td className="py-2 pr-4 font-mono text-cyan-400">{c.pool_id}</td>
                    <td className="py-2 pr-4">{c.bond_curve_funding_velocity}</td>
                    <td className="py-2 pr-4">{(c.unique_wallets_ratio * 100).toFixed(0)}%</td>
                    <td className="py-2 pr-4">{c.created_at_sec_ago}s</td>
                    <td className="py-2">{c.dev_wallet_active ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {running ? "Running…" : "Run Classical vs Quantum ranking"}
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
                      <span>Classical (rules)</span>
                    </div>
                    <p className="text-sm text-slate-400">Ranking: {result.comparison.classical_ranking.join(" → ")}</p>
                    <p className="mt-1 text-sm text-slate-400">Time: {result.comparison.classical_time_ms.toFixed(2)} ms · Factors: {result.comparison.factors_classical}</p>
                  </div>
                  <div className="rounded-lg border border-cyan-500/50 bg-slate-900/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-cyan-400">
                      <Zap className="h-5 w-5" />
                      <span>Quantum (QUBO)</span>
                    </div>
                    <p className="text-sm text-slate-400">Ranking: {result.comparison.quantum_ranking.join(" → ")}</p>
                    <p className="mt-1 text-sm text-slate-400">Time: {result.comparison.quantum_time_ms.toFixed(2)} ms · Factors: {result.comparison.factors_quantum}</p>
                  </div>
                </div>
                <p className="mt-4 text-white">
                  Winner: <span className={result.comparison.winner === "quantum" ? "text-cyan-400" : "text-amber-400"}>{result.comparison.winner}</span>
                </p>
              </div>
            )}

            <div className="rounded-xl border border-slate-600 bg-slate-800/40 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Full ranking table (scores &amp; Fly recommendation)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-600">
                      <th className="pb-2 pr-4">Pool</th>
                      <th className="pb-2 pr-4">Classical score</th>
                      <th className="pb-2 pr-4">Classical rank</th>
                      <th className="pb-2 pr-4">Quantum score</th>
                      <th className="pb-2 pr-4">Quantum rank</th>
                      <th className="pb-2">Fly?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.ranking.map((r) => (
                      <tr key={r.pool_id} className="border-b border-slate-700/50">
                        <td className="py-2 pr-4 font-mono text-cyan-400">{r.pool_id}</td>
                        <td className="py-2 pr-4">{r.classical_score}</td>
                        <td className="py-2 pr-4">{r.classical_rank}</td>
                        <td className="py-2 pr-4">{r.quantum_score}</td>
                        <td className="py-2 pr-4">{r.quantum_rank}</td>
                        <td className="py-2">{r.fly ? <span className="text-green-400">Yes</span> : <span className="text-slate-500">No</span>}</td>
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
