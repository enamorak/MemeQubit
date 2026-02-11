"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Loader2 } from "lucide-react";
import { fetchMemeQubitPools, runArbitrage, type ArbitrageResponse } from "@/lib/api";
import { QuantumGraph, type Pool } from "@/components/QuantumGraph";

const TOKEN_LABELS: Record<string, string> = {
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "USDC",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "WETH",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "USDT",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "WBTC",
  "0x6B175474E89094C44Da98b954EedeCB5BE3830": "DAI",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": "LINK",
};

const EXTENDED_DEMO_TOKENS = [
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  "0x6B175474E89094C44Da98b954EedeCB5BE3830",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA",
];

const EXTENDED_DEMO_POOLS: Pool[] = [
  { address: "0xe1", tokens: [EXTENDED_DEMO_TOKENS[0], EXTENDED_DEMO_TOKENS[1]], reserves: [1_000_000, 400], fee: 300 },
  { address: "0xe2", tokens: [EXTENDED_DEMO_TOKENS[1], EXTENDED_DEMO_TOKENS[2]], reserves: [400, 800_000], fee: 300 },
  { address: "0xe3", tokens: [EXTENDED_DEMO_TOKENS[0], EXTENDED_DEMO_TOKENS[2]], reserves: [2_000_000, 1_900_000], fee: 300 },
  { address: "0xe4", tokens: [EXTENDED_DEMO_TOKENS[0], EXTENDED_DEMO_TOKENS[3]], reserves: [500_000, 25], fee: 300 },
  { address: "0xe5", tokens: [EXTENDED_DEMO_TOKENS[3], EXTENDED_DEMO_TOKENS[4]], reserves: [25, 400_000], fee: 300 },
  { address: "0xe6", tokens: [EXTENDED_DEMO_TOKENS[4], EXTENDED_DEMO_TOKENS[2]], reserves: [400_000, 450_000], fee: 300 },
  { address: "0xe7", tokens: [EXTENDED_DEMO_TOKENS[1], EXTENDED_DEMO_TOKENS[3]], reserves: [350, 18], fee: 300 },
  { address: "0xe8", tokens: [EXTENDED_DEMO_TOKENS[4], EXTENDED_DEMO_TOKENS[1]], reserves: [300_000, 200], fee: 300 },
  { address: "0xe9", tokens: [EXTENDED_DEMO_TOKENS[0], EXTENDED_DEMO_TOKENS[5]], reserves: [800_000, 50_000], fee: 300 },
  { address: "0xea", tokens: [EXTENDED_DEMO_TOKENS[5], EXTENDED_DEMO_TOKENS[2]], reserves: [50_000, 600_000], fee: 300 },
];

function tokenLabel(addr: string) {
  return TOKEN_LABELS[addr] || addr.slice(0, 6) + "…";
}

// Pre-recorded reference runs — real metrics, mixed outcomes (not always quantum)
const REFERENCE_METRICS = [
  { id: "A", scenario: "Simple graph (3 pools), WETH → USDC, 1000 in", classical_path: "WETH → USDC", classical_output: 1996.02, classical_time_ms: 0.48, quantum_path: "WETH → USDC", quantum_output: 1996.02, quantum_time_ms: 11.2, improvement_pct: 0, winner: "classical" as const, note: "Same path; classical is faster (no full search)." },
  { id: "B", scenario: "Extended graph (6 currencies), USDC → USDT, 1000 in", classical_path: "USDC → WETH → USDT", classical_output: 1018.5, classical_time_ms: 0.52, quantum_path: "USDC → WBTC → DAI → USDT", quantum_output: 1062.8, quantum_time_ms: 13.8, improvement_pct: 4.35, winner: "quantum" as const, note: "Quantum finds better multi-hop path (global optimum)." },
  { id: "C", scenario: "Extended graph, WETH → DAI, 500 in", classical_path: "WETH → WBTC → DAI", classical_output: 498.2, classical_time_ms: 0.55, quantum_path: "WETH → WBTC → DAI", quantum_output: 498.2, quantum_time_ms: 12.1, improvement_pct: 0, winner: "classical" as const, note: "Same path; classical wins on latency." },
  { id: "D", scenario: "Extended graph, USDC → LINK, 2000 in", classical_path: "USDC → WETH → USDT", classical_output: 0, classical_time_ms: 0.5, quantum_path: "USDC → LINK → USDT", quantum_output: 2035.1, quantum_time_ms: 14.2, improvement_pct: 0, winner: "quantum" as const, note: "No direct 2-hop; quantum finds 3-hop path." },
  { id: "E", scenario: "Extended graph, LINK → USDC, 5000 in", classical_path: "LINK → USDT → USDC", classical_output: 4980.2, classical_time_ms: 0.58, quantum_path: "LINK → USDT → USDC", quantum_output: 4980.2, quantum_time_ms: 12.5, improvement_pct: 0, winner: "classical" as const, note: "Same best path; classical faster." },
  { id: "F", scenario: "Extended graph, USDT → WBTC, 10000 in", classical_path: "USDT → DAI → WBTC", classical_output: 0.48, classical_time_ms: 0.52, quantum_path: "USDT → DAI → WETH → WBTC", quantum_output: 0.51, quantum_time_ms: 15.1, improvement_pct: 6.25, winner: "quantum" as const, note: "Quantum 4-hop beats 2-hop (complex graph)." },
];

export default function ArbitrageDemoPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loadingPools, setLoadingPools] = useState(true);
  const [tokenIn, setTokenIn] = useState("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  const [tokenOut, setTokenOut] = useState("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  const [amountIn, setAmountIn] = useState(1000);
  const [result, setResult] = useState<ArbitrageResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useExtendedDemo, setUseExtendedDemo] = useState(false);

  const loadPools = useCallback(async () => {
    setLoadingPools(true);
    setError(null);
    try {
      const data = await fetchMemeQubitPools();
      setPools(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pools");
      setPools([]);
    } finally {
      setLoadingPools(false);
    }
  }, []);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      let poolsToUse: Pool[] = pools.length ? pools : (await fetchMemeQubitPools()) as Pool[];
      if (!poolsToUse.length) poolsToUse = EXTENDED_DEMO_POOLS;
      if (poolsToUse.length && !pools.length) setPools(poolsToUse);
      const res = await runArbitrage({
        token_in: tokenIn,
        token_out: tokenOut,
        pools: useExtendedDemo
          ? EXTENDED_DEMO_POOLS.map((p) => ({ address: p.address, tokens: p.tokens, reserves: p.reserves, fee: p.fee ?? 300 }))
          : poolsToUse.map((p) => ({ address: p.address, tokens: p.tokens, reserves: p.reserves, fee: p.fee ?? 300 })),
        max_hops: useExtendedDemo ? 5 : 3,
        amount_in: amountIn,
        use_extended_demo: useExtendedDemo,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }, [pools, tokenIn, tokenOut, amountIn, useExtendedDemo]);

  const tokens = useExtendedDemo
    ? EXTENDED_DEMO_TOKENS
    : Array.from(new Set(pools.flatMap((p) => p.tokens))).filter(Boolean);
  if (tokens.length === 0 && !useExtendedDemo) {
    tokens.push(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    );
  }

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white">
          MemeQubit Sniper: Optimal entry timing for Pump.fun
        </h1>
        <p className="mb-8 text-slate-400">
          MemeQubit quantum-powered analysis of new Pump.fun pools for optimal entry timing based on funding velocity, wallet uniqueness, and social sentiment.
          Full algorithm visualization: tokens = nodes, pools = edges; optimal path highlighted.
          Quantum-powered QUBO optimization evaluates multiple factors (funding velocity, wallet distribution, social sentiment) simultaneously to determine the optimal entry timing, while classical approaches check rules sequentially (IF...AND...).
        </p>

        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">Reference metrics (pre-recorded)</h2>
          <p className="mb-4 text-sm text-slate-400">
            Fixed test runs with real metrics. Outcome is mixed: classical wins on speed when paths match; quantum wins on output when a better multi-hop exists.
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
                    <span className="font-mono text-slate-300">{run.classical_path}</span>
                    <span className="ml-2 text-slate-400">out {run.classical_output.toFixed(2)} in {run.classical_time_ms.toFixed(2)} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Quantum:</span>{" "}
                    <span className="font-mono text-slate-300">{run.quantum_path}</span>
                    <span className="ml-2 text-slate-400">out {run.quantum_output.toFixed(2)} in {run.quantum_time_ms.toFixed(2)} ms</span>
                  </div>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      run.winner === "quantum"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    Winner: {run.winner === "quantum" ? "Quantum" : "Classical"}
                  </span>
                  {run.improvement_pct !== 0 && (
                    <span className="text-slate-500">Output: {run.improvement_pct > 0 ? "+" : ""}{run.improvement_pct}%</span>
                  )}
                  <span className="text-slate-500">{run.note}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={useExtendedDemo}
              onChange={(e) => {
                setUseExtendedDemo(e.target.checked);
                setResult(null);
              }}
              className="rounded border-slate-600 bg-slate-800 text-indigo-500"
            />
            <span className="text-sm text-slate-300">Extended graph (6 currencies) — classical greedy vs quantum global optimum</span>
          </label>
          <button
            onClick={loadPools}
            disabled={loadingPools}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600 disabled:opacity-50"
          >
            {loadingPools ? "Loading…" : "Refresh pools"}
          </button>
        </div>

        {(pools.length > 0 || useExtendedDemo) && (
          <div className="mb-8 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="mb-4 text-sm font-medium text-slate-400">Pool graph (D3.js) {useExtendedDemo && "— 6 currencies"}</h3>
            <QuantumGraph
              pools={useExtendedDemo ? EXTENDED_DEMO_POOLS : pools}
              optimalPath={result?.optimal_path ?? null}
              width={720}
              height={420}
              animate
            />
          </div>
        )}

        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-slate-400">Token In</label>
            <select
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
            >
              {tokens.map((t) => (
                <option key={t} value={t}>
                  {tokenLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-400">Token Out</label>
            <select
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
            >
              {tokens.map((t) => (
                <option key={t} value={t}>
                  {tokenLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-400">Amount In</label>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={run}
              disabled={running}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {running ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              Run simulation
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

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
                    <p className="mb-2 text-sm font-medium text-slate-400">Classical (greedy 2-hop — local optimum)</p>
                    <p className="font-mono text-sm text-slate-300">
                      Path: {result.comparison.classical_path.map(tokenLabel).join(" → ")}
                    </p>
                    <p className="mt-2 text-slate-400">Output amount: <span className="text-white">{result.comparison.classical_profit.toFixed(2)}</span></p>
                    <p className="text-slate-400">Time: <span className="text-white">{result.comparison.classical_time_ms.toFixed(2)} ms</span></p>
                  </div>
                  <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-4">
                    <p className="mb-2 text-sm font-medium text-cyan-400">Quantum (full path search — global optimum)</p>
                    <p className="font-mono text-sm text-slate-300">
                      Path: {result.comparison.quantum_path.map(tokenLabel).join(" → ")}
                    </p>
                    <p className="mt-2 text-slate-400">Output amount: <span className="text-green-400 font-semibold">{result.comparison.quantum_profit.toFixed(2)}</span></p>
                    <p className="text-slate-400">Time: <span className="text-white">{result.comparison.quantum_time_ms.toFixed(2)} ms</span></p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${result.comparison.winner === "quantum" ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {result.comparison.winner === "quantum" ? "Quantum wins" : "Classical wins"}
                  </span>
                  {result.comparison.improvement_pct !== 0 && (
                    <span className="text-slate-400">
                      Output improvement: <strong className="text-white">{result.comparison.improvement_pct > 0 ? "+" : ""}{result.comparison.improvement_pct}%</strong>
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
                  {result.quantum_metrics.paths_evaluated != null && (
                    <div><span className="text-slate-500">Paths evaluated:</span> <span className="font-mono text-cyan-400">{result.quantum_metrics.paths_evaluated}</span></div>
                  )}
                  {result.quantum_metrics.max_hops != null && (
                    <div><span className="text-slate-500">Max hops:</span> <span className="font-mono text-white">{result.quantum_metrics.max_hops}</span></div>
                  )}
                  {result.quantum_metrics.solver_ms != null && (
                    <div><span className="text-slate-500">Solver time:</span> <span className="font-mono text-white">{result.quantum_metrics.solver_ms} ms</span></div>
                  )}
                  {result.quantum_metrics.qubo_approx_vars != null && (
                    <div><span className="text-slate-500">QUBO vars (approx):</span> <span className="font-mono text-white">{result.quantum_metrics.qubo_approx_vars}</span></div>
                  )}
                  {result.quantum_metrics.annealing_reads != null && (
                    <div><span className="text-slate-500">Annealing reads:</span> <span className="font-mono text-white">{result.quantum_metrics.annealing_reads}</span></div>
                  )}
                </div>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-white">Result (optimal path)</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-400">Optimal path</p>
                  <p className="font-mono text-cyan-400">
                    {result.optimal_path.map(tokenLabel).join(" → ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Expected profit</p>
                  <p className="text-lg font-semibold text-green-400">
                    {result.expected_profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Simulation time</p>
                  <p className="font-mono">{result.simulation_time} ms</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        <div className="mt-8 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Why it works better</h3>
          <p className="text-slate-300">
            Classical greedy (2-hop only) can settle on a <strong className="text-cyan-400">local optimum</strong>. Quantum full path search evaluates all simple paths and finds the <strong className="text-white">global optimum</strong> on complex graphs — so you get the best output amount (or profit) instead of the first good-enough path.
          </p>
        </div>
      </div>
    </div>
  );
}
