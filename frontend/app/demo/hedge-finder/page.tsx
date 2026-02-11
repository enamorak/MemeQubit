"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Shield, Cpu, Zap } from "lucide-react";
import {
  runHedgeFinder,
  type HedgeFinderResponse,
} from "@/lib/api";

const MEME_TOKEN_LABELS: Record<string, string> = {
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "USDC",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "WETH",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "USDT",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "WBTC",
  "0x6B175474E89094C44Da98b954EedeCB5BE3830": "DAI",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": "LINK",
};

const DEMO_POOLS: { address: string; tokens: string[]; reserves: number[]; fee: number }[] = [
  { address: "0xe1", tokens: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"], reserves: [1000000, 400], fee: 300 },
  { address: "0xe2", tokens: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xdAC17F958D2ee523a2206206994597C13D831ec7"], reserves: [400, 800000], fee: 300 },
  { address: "0xe3", tokens: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0xdAC17F958D2ee523a2206206994597C13D831ec7"], reserves: [2000000, 1900000], fee: 300 },
  { address: "0xe4", tokens: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"], reserves: [500000, 25], fee: 300 },
  { address: "0xe5", tokens: ["0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", "0x6B175474E89094C44Da98b954EedeCB5BE3830"], reserves: [25, 400000], fee: 300 },
  { address: "0xe6", tokens: ["0x6B175474E89094C44Da98b954EedeCB5BE3830", "0xdAC17F958D2ee523a2206206994597C13D831ec7"], reserves: [400000, 450000], fee: 300 },
];

function pathLabel(path: string[]): string {
  return path.map((addr) => MEME_TOKEN_LABELS[addr] || addr.slice(0, 8) + "…").join(" → ");
}

export default function HedgeFinderDemoPage() {
  const [tokenToHedge, setTokenToHedge] = useState("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  const [targetStable, setTargetStable] = useState("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  const [result, setResult] = useState<HedgeFinderResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runHedgeFinder({
        token_to_hedge: tokenToHedge,
        pools: DEMO_POOLS,
        target_stable: targetStable,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hedge finder failed");
    } finally {
      setRunning(false);
    }
  }, [tokenToHedge, targetStable]);

  const tokenOptions = Array.from(
    new Set(DEMO_POOLS.flatMap((p) => p.tokens))
  );

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white flex items-center gap-2">
          <Shield className="h-8 w-8 text-cyan-400" />
          Quantum Hedge Finder
        </h1>
        <p className="mb-8 text-slate-400 max-w-3xl">
          You are long a meme token; the market is falling. What to short or buy to hedge? Classical approach:
          greedy 2-hop path to a stable. Quantum approach: full path search over the graph of meme + stable assets
          to find the global optimum. Results show output amount (e.g. stable received for 1000 units of held token)
          and path.
        </p>

        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6 max-w-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Test setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Token to hedge (you hold)</label>
              <select
                value={tokenToHedge}
                onChange={(e) => setTokenToHedge(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
              >
                {tokenOptions.map((addr) => (
                  <option key={addr} value={addr}>
                    {MEME_TOKEN_LABELS[addr] || addr.slice(0, 10)}…
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Target stable</label>
              <select
                value={targetStable}
                onChange={(e) => setTargetStable(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
              >
                {tokenOptions.map((addr) => (
                  <option key={addr} value={addr}>
                    {MEME_TOKEN_LABELS[addr] || addr.slice(0, 10)}…
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">Pools: 6 (WETH, USDC, USDT, WBTC, DAI). Simulated 1000 units in.</p>
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

        {result && result.comparison && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-600 bg-slate-800/40 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Comparison: Classical vs Quantum</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-300">
                  <Cpu className="h-5 w-5" />
                  <span>Classical (2-hop)</span>
                </div>
                <p className="text-slate-300">Path: {pathLabel(result.comparison.classical_path)}</p>
                <p className="text-slate-400">Output: {result.comparison.classical_output.toFixed(2)}</p>
                <p className="text-slate-400">Time: {result.comparison.classical_time_ms.toFixed(2)} ms</p>
              </div>
              <div className="rounded-lg border border-cyan-500/50 bg-slate-900/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-400">
                  <Zap className="h-5 w-5" />
                  <span>Quantum (full path)</span>
                </div>
                <p className="text-slate-300">Path: {pathLabel(result.comparison.quantum_path)}</p>
                <p className="text-slate-400">Output: {result.comparison.quantum_output.toFixed(2)}</p>
                <p className="text-slate-400">Time: {result.comparison.quantum_time_ms.toFixed(2)} ms</p>
              </div>
            </div>
            <p className="mt-4 text-slate-300">
              Improvement: {result.comparison.improvement_pct.toFixed(2)}% · Winner:{" "}
              <span className={result.comparison.winner === "quantum" ? "text-cyan-400" : "text-amber-400"}>
                {result.comparison.winner}
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-500">Simulation time: {result.simulation_time} ms</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
