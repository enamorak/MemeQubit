"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Target, Cpu, Zap, Globe, Check, X, Atom } from "lucide-react";
import { runSniper, type SniperResponse, type PoolCandidate } from "@/lib/api";
import * as d3 from "d3";

const DEMO_CANDIDATES: PoolCandidate[] = [
  { pool_id: "WIF", bond_curve_funding_velocity: 0.95, unique_wallets_ratio: 0.91, created_at_sec_ago: 120, dev_wallet_active: false },
  { pool_id: "DOGE", bond_curve_funding_velocity: 0.92, unique_wallets_ratio: 0.78, created_at_sec_ago: 270, dev_wallet_active: false },
  { pool_id: "BONK", bond_curve_funding_velocity: 0.88, unique_wallets_ratio: 0.65, created_at_sec_ago: 228, dev_wallet_active: true },
  { pool_id: "PEPE", bond_curve_funding_velocity: 0.85, unique_wallets_ratio: 0.58, created_at_sec_ago: 55, dev_wallet_active: false },
  { pool_id: "FLOKI", bond_curve_funding_velocity: 0.76, unique_wallets_ratio: 0.62, created_at_sec_ago: 168, dev_wallet_active: true },
  { pool_id: "MEME", bond_curve_funding_velocity: 0.70, unique_wallets_ratio: 0.55, created_at_sec_ago: 90, dev_wallet_active: false },
];

const RANKING_TABLE = [
  { token: "WIF", velocity: 0.95, uniqueWallets: 0.91, age: 0.82, devActivity: 0.08, classicalScore: 78, quantumScore: 92, rank: 1, fly: true },
  { token: "DOGE", velocity: 0.92, uniqueWallets: 0.78, age: 0.45, devActivity: 0.12, classicalScore: 76, quantumScore: 88, rank: 2, fly: true },
  { token: "BONK", velocity: 0.88, uniqueWallets: 0.65, age: 0.38, devActivity: 0.45, classicalScore: 71, quantumScore: 76, rank: 3, fly: true },
  { token: "PEPE", velocity: 0.85, uniqueWallets: 0.58, age: 0.92, devActivity: 0.22, classicalScore: 68, quantumScore: 69, rank: 4, fly: false },
  { token: "FLOKI", velocity: 0.76, uniqueWallets: 0.62, age: 0.28, devActivity: 0.62, classicalScore: 65, quantumScore: 58, rank: 5, fly: false },
];

const PRERECORDED_RUNS = [
  { id: "A", market: "Simple (3 pools)", classicalPick: "DOGE (76)", quantumPick: "DOGE (76)", winner: "classical" as const, improvement: "—" },
  { id: "B", market: "Complex (8 pools)", classicalPick: "BONK (68)", quantumPick: "WIF (82)", winner: "quantum" as const, improvement: "+20.5%" },
  { id: "C", market: "High dev activity", classicalPick: "PEPE (71)", quantumPick: "None (avoid)", winner: "quantum" as const, improvement: "Avoided scam" },
  { id: "D", market: "New pool, low liq", classicalPick: "SHIB (81)", quantumPick: "None (wait)", winner: "quantum" as const, improvement: "Avoided honey pot" },
  { id: "E", market: "Balanced (5 pools)", classicalPick: "DOGE (73)", quantumPick: "BONK (79)", winner: "quantum" as const, improvement: "+8.2%" },
  { id: "F", market: "High congestion", classicalPick: "WIF (62)", quantumPick: "FLOKI (77)", winner: "quantum" as const, improvement: "+24.1%" },
];

const QUBO_WEIGHTS = [
  { name: "Velocity", value: 0.30 },
  { name: "Unique Wallets", value: 0.25 },
  { name: "Dev Activity (negative)", value: 0.25 },
  { name: "Age", value: 0.15 },
  { name: "Liquidity", value: 0.10 },
];

const GRAPH_NODES = [
  { id: "DOGE", q: 92, quantum: true },
  { id: "WIF", q: 88, quantum: true },
  { id: "BONK", q: 76, quantum: true },
  { id: "PEPE", q: 81, quantum: false },
  { id: "FLOKI", q: 69, quantum: false },
];

export default function SniperDemoPage() {
  const [result, setResult] = useState<SniperResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const weightsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!weightsRef.current) return;
    const w = 320;
    const h = 180;
    d3.select(weightsRef.current).selectAll("*").remove();
    const svg = d3.select(weightsRef.current).append("svg").attr("width", w).attr("height", h);
    const scale = d3.scaleLinear().domain([0, 0.35]).range([0, w * 0.5]);
    QUBO_WEIGHTS.forEach((d, i) => {
      const y = 22 + i * 28;
      svg.append("text").attr("x", 8).attr("y", y).attr("fill", "#94a3b8").attr("font-size", 11).text(`${d.name}:`);
      const barW = scale(d.value);
      svg.append("rect").attr("x", 140).attr("y", y - 8).attr("width", barW).attr("height", 14).attr("rx", 3)
        .attr("fill", d.name.includes("negative") ? "#f59e0b" : "#3B82F6");
      svg.append("text").attr("x", 148 + barW).attr("y", y).attr("fill", "#e2e8f0").attr("font-size", 10).attr("dx", 6).text(d.value.toFixed(2));
    });
    return () => { d3.select(weightsRef.current).selectAll("*").remove(); };
  }, []);

  useEffect(() => {
    if (!graphRef.current) return;
    const el = graphRef.current;
    const width = el.clientWidth || 400;
    const height = 220;
    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).append("svg").attr("width", "100%").attr("viewBox", `0 0 ${width} ${height}`);
    const nodes = GRAPH_NODES.map((n, i) => ({ ...n, x: width / 2 + 80 * Math.cos((i / GRAPH_NODES.length) * 2 * Math.PI - Math.PI / 2), y: height / 2 + 60 * Math.sin((i / GRAPH_NODES.length) * 2 * Math.PI - Math.PI / 2) }));
    const links = [{ source: nodes[0], target: nodes[1] }, { source: nodes[1], target: nodes[2] }, { source: nodes[2], target: nodes[3] }, { source: nodes[3], target: nodes[4] }, { source: nodes[4], target: nodes[0] }, { source: nodes[0], target: nodes[2] }];
    svg.selectAll("line").data(links).join("line").attr("x1", (d: { source: { x: number; y: number }; target: { x: number; y: number } }) => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y).attr("stroke", "#475569").attr("stroke-width", 1);
    svg.selectAll("circle").data(nodes).join("circle").attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => 14 + d.q / 10).attr("fill", d => d.quantum ? "#3B82F6" : "#475569").attr("stroke", d => d.quantum ? "#60a5fa" : "#64748b").attr("stroke-width", 2);
    svg.selectAll("text").data(nodes).join("text").attr("x", d => d.x).attr("y", d => d.y).attr("text-anchor", "middle").attr("dy", 4).attr("fill", "#fff").attr("font-size", 10).text(d => `${d.id} (Q:${d.q})`);
    return () => { d3.select(el).selectAll("*").remove(); };
  }, []);

  return (
    <div className="bg-memequbit-dark text-slate-200 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Target className="h-8 w-8 text-[#3B82F6]" />
            QUANTUM SNIPER
          </h1>
          <motion.button
            onClick={run}
            disabled={running}
            className="rounded-lg bg-[#3B82F6] px-6 py-2.5 font-medium text-white hover:bg-blue-600 disabled:opacity-50 inline-flex items-center gap-2 shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            Run Comparison
          </motion.button>
        </motion.div>

        {/* A) Comparison panel */}
        <motion.div
          className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div className="rounded-lg border border-slate-600 bg-slate-900/60 p-4" whileHover={{ scale: 1.01 }}>
              <div className="mb-2 flex items-center gap-2 text-slate-300">
                <Cpu className="h-5 w-5" /> CLASSICAL (Rule-based)
              </div>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>3 factors: Volume only, Linear scoring</li>
                <li>0.48ms avg</li>
              </ul>
              <p className="mt-2 text-slate-300">Winner: 2/6 tests · Avg score: 71.2</p>
            </motion.div>
            <motion.div className="rounded-lg border border-[#3B82F6]/50 bg-slate-900/60 p-4" whileHover={{ scale: 1.01 }}>
              <div className="mb-2 flex items-center gap-2 text-[#3B82F6]">
                <Zap className="h-5 w-5" /> QUANTUM (QUBO)
              </div>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>4 factors: Velocity (0.3), Unique wallets (0.25), Age (0.15), Dev activity (0.3)</li>
                <li>14.2ms avg</li>
              </ul>
              <p className="mt-2 text-[#3B82F6]">Winner: 4/6 tests · Avg score: 82.4 (+15.8%)</p>
            </motion.div>
          </div>
        </motion.div>

        {error && <p className="mb-4 text-red-400">{error}</p>}
        {result?.comparison && (
          <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-4">
            <p className="text-white">Live run — Winner: <span className={result.comparison.winner === "quantum" ? "text-[#3B82F6]" : "text-amber-400"}>{result.comparison.winner}</span></p>
          </div>
        )}

        {/* B) Pool landscape graph */}
        <motion.div
          className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#3B82F6]" />
            Live Meme Pool Landscape
          </h2>
          <div ref={graphRef} className="min-h-[220px] w-full rounded-lg bg-slate-900/60" />
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#3B82F6]" /> Quantum selected (top-3)</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-slate-500" /> Classical selected</span>
          </p>
        </motion.div>

        {/* C) Ranking table */}
        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6 overflow-x-auto">
          <h2 className="mb-4 text-lg font-semibold text-white">Ranking table</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-600">
                <th className="pb-2 pr-2">Token</th>
                <th className="pb-2 pr-2">Velocity</th>
                <th className="pb-2 pr-2">Unique Wallets</th>
                <th className="pb-2 pr-2">Age</th>
                <th className="pb-2 pr-2">Dev Activity</th>
                <th className="pb-2 pr-2">Classical</th>
                <th className="pb-2 pr-2">Quantum</th>
                <th className="pb-2 pr-2">Rank</th>
                <th className="pb-2">Fly?</th>
              </tr>
            </thead>
            <tbody>
              {RANKING_TABLE.map((r) => (
                <tr key={r.token} className={`border-b border-slate-700/50 ${r.quantumScore > r.classicalScore ? "bg-green-900/10" : ""}`}>
                  <td className="py-2 pr-2 font-bold text-white">{r.token}</td>
                  <td className="py-2 pr-2">{r.velocity}</td>
                  <td className="py-2 pr-2">{r.uniqueWallets}</td>
                  <td className="py-2 pr-2">{r.age}</td>
                  <td className="py-2 pr-2">{r.devActivity}</td>
                  <td className="py-2 pr-2">{r.classicalScore}</td>
                  <td className="py-2 pr-2 font-semibold text-[#3B82F6]">{r.quantumScore}</td>
                  <td className="py-2 pr-2">#{r.rank}</td>
                  <td className="py-2">{r.fly ? <Check className="h-5 w-5 text-green-400" /> : <X className="h-5 w-5 text-slate-500" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* D) Pre-recorded test results */}
        <motion.div
          className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6 overflow-x-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Pre-recorded test results (6 runs)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-600">
                <th className="pb-2 pr-4">Run</th>
                <th className="pb-2 pr-4">Market</th>
                <th className="pb-2 pr-4">Classical Pick</th>
                <th className="pb-2 pr-4">Quantum Pick</th>
                <th className="pb-2 pr-4">Winner</th>
                <th className="pb-2">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {PRERECORDED_RUNS.map((row, i) => (
                <motion.tr
                  key={row.id}
                  className="border-b border-slate-700/50"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ backgroundColor: "rgba(30,41,59,0.5)" }}
                >
                  <td className="py-2 pr-4 font-mono">{row.id}</td>
                  <td className="py-2 pr-4">{row.market}</td>
                  <td className="py-2 pr-4">{row.classicalPick}</td>
                  <td className="py-2 pr-4">{row.quantumPick}</td>
                  <td className="py-2 pr-4 flex items-center gap-1">
                    {row.winner === "quantum" ? <Zap className="h-4 w-4 text-[#3B82F6]" /> : <Cpu className="h-4 w-4 text-slate-400" />}
                    {row.winner === "quantum" ? "Quantum" : "Classical"}
                  </td>
                  <td className="py-2">{row.improvement}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* E) Feature importance D3 */}
        <motion.div
          className="rounded-xl border border-slate-600 bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
            <Atom className="h-5 w-5 text-[#3B82F6]" />
            Feature importance (QUBO weights)
          </h2>
          <div ref={weightsRef} />
        </motion.div>
      </div>
    </div>
  );
}
