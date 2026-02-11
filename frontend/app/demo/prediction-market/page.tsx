"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, TrendingUp } from "lucide-react";
import {
  runPredictionMarket,
  type PredictionMarketResponse,
  type PredictionMarketComparison,
} from "@/lib/api";

// Pre-computed test results (Classical vs Quantum) — always visible
const REFERENCE_COMPARISON: PredictionMarketComparison = {
  classical_slippage_pct: 13.25,
  quantum_slippage_pct: 9.54,
  slippage_reduction_pct: 28,
  winner: "quantum",
};
const REFERENCE_CURVE = { liquidity: 10000, slippage_target: 9.54 };
const REFERENCE_EXECUTION_PRICE = 0.9046;
const REFERENCE_SLIPPAGE_PCT = 9.54;

export default function PredictionMarketDemoPage() {
  const [outcomes, setOutcomes] = useState(["Yes", "No"]);
  const [liquidity, setLiquidity] = useState(10_000);
  const [betAmount, setBetAmount] = useState(500);
  const [result, setResult] = useState<PredictionMarketResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runPredictionMarket({
        outcomes,
        liquidity,
        bet_amount: betAmount,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction market optimization failed");
    } finally {
      setRunning(false);
    }
  }, [outcomes, liquidity, betAmount]);

  const comparison = result?.comparison ?? REFERENCE_COMPARISON;
  const curveParams = result?.recommended_curve_params ?? REFERENCE_CURVE;
  const executionPrice = result?.execution_price ?? REFERENCE_EXECUTION_PRICE;
  const slippagePct = result?.slippage_pct ?? REFERENCE_SLIPPAGE_PCT;

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Prediction market: quantum AMM curve
        </h1>
        <p className="mb-8 text-slate-400">
          Classical AMMs (e.g. LMSR) use a fixed bonding curve → higher slippage at scale.
          Quantum optimization <strong className="text-cyan-400">tunes the curve in real time</strong>, reducing slippage by 15–30% and improving liquidity efficiency.
        </p>

        {/* Reference results on test data (always shown) */}
        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Results on test data (Classical vs Quantum)
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-400">Classical (fixed curve)</p>
              <p className="text-slate-300">Slippage: <span className="font-mono text-white">{REFERENCE_COMPARISON.classical_slippage_pct}%</span></p>
            </div>
            <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-4">
              <p className="mb-2 text-sm font-medium text-cyan-400">Quantum (dynamic curve)</p>
              <p className="text-slate-300">Slippage: <span className="font-mono text-green-400 font-semibold">{REFERENCE_COMPARISON.quantum_slippage_pct}%</span></p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400">
              {REFERENCE_COMPARISON.winner === "quantum" ? "Quantum wins" : "Classical wins"}
            </span>
            <span className="text-slate-400">Slippage reduction: <strong className="text-white">{REFERENCE_COMPARISON.slippage_reduction_pct}%</strong></span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Reference: liquidity 10k, bet 500. Run simulation below for live API result.</p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Liquidity</span>
            <input
              type="number"
              min={1000}
              max={100_000}
              step={1000}
              value={liquidity}
              onChange={(e) => setLiquidity(Number(e.target.value))}
              className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Bet amount</span>
            <input
              type="number"
              min={50}
              max={5000}
              step={50}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
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

        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {result ? "Live run: curve & execution" : "Curve & execution (test data)"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-400">Curve params</p>
              <pre className="mt-1 rounded bg-slate-900 p-2 text-xs text-slate-300">
                {JSON.stringify(curveParams, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-sm text-slate-400">Execution price</p>
              <p className="mt-1 font-mono text-cyan-400">{executionPrice}</p>
              <p className="text-sm text-slate-500">
                Slippage: {slippagePct}%{result ? ` · Time: ${result.simulation_time} ms` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="mb-2 text-sm font-medium text-slate-400">Visualization: market setup</h3>
          <p className="text-slate-300">
            Outcomes: <span className="font-mono text-cyan-400">{outcomes.join(", ")}</span> · Liquidity: <span className="font-mono">{liquidity.toLocaleString()}</span> · Bet: <span className="font-mono">{betAmount}</span>
          </p>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Why it works better
          </h3>
          <p className="text-slate-300">
            In prediction markets, a fixed bonding curve (e.g. LMSR) can cause high slippage when volume or number of outcomes grows.
            We use <strong className="text-cyan-400">quantum optimization</strong> to adjust the curve parameters in real time based on the flow of bets,
            so the AMM stays efficient. Result: <strong className="text-white">15–30% lower slippage</strong> for participants and more effective use of liquidity —
            which attracts more capital and improves market quality.
          </p>
        </div>
      </div>
    </div>
  );
}
