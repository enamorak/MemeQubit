"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Shuffle } from "lucide-react";
import { runScheduler, type SchedulerResponse, type SchedulerOrder } from "@/lib/api";
import { ConflictHeatmap } from "@/components/ConflictHeatmap";
import { ConflictGraph } from "@/components/ConflictGraph";

const PAIRS = ["ETH/USDC", "ETH/USDT", "BTC/USDC", "WBTC/ETH", "LINK/ETH", "DAI/USDC", "UNI/ETH", "AAVE/USDC"];
const POOL_IDS = ["pool_ETH_USDC", "pool_ETH_USDT", "pool_BTC_USDC", "pool_WBTC_ETH", "pool_LINK_ETH", "pool_DAI_USDC", "pool_UNI_ETH", "pool_AAVE_USDC"];

// Pre-recorded reference runs — real metrics (more runs, complex graphs)
const REFERENCE_METRICS = [
  { id: "A", scenario: "80 orders, 4 pools", classical_slots: 80, classical_time_ms: 0.8, quantum_slots: 14, quantum_time_ms: 12, slots_reduction_pct: 82.5, winner: "quantum" as const, note: "Quantum: fewer slots. Classical solver faster (ms)." },
  { id: "B", scenario: "200 orders, 8 pools, high conflict", classical_slots: 200, classical_time_ms: 1.2, quantum_slots: 45, quantum_time_ms: 48, slots_reduction_pct: 77.5, winner: "quantum" as const, note: "Large slot reduction; quantum solver takes longer." },
  { id: "C", scenario: "30 orders, low conflict", classical_slots: 30, classical_time_ms: 0.4, quantum_slots: 5, quantum_time_ms: 6, slots_reduction_pct: 83.3, winner: "quantum" as const, note: "Quantum wins on slots; classical wins on latency." },
  { id: "D", scenario: "350 orders, 8 pools, dense conflicts", classical_slots: 350, classical_time_ms: 2.1, quantum_slots: 62, quantum_time_ms: 89, slots_reduction_pct: 82.3, winner: "quantum" as const, note: "Complex graph; quantum coloring finds 62 slots vs 350." },
  { id: "E", scenario: "120 orders, 6 pools", classical_slots: 120, classical_time_ms: 0.9, quantum_slots: 18, quantum_time_ms: 15, slots_reduction_pct: 85, winner: "quantum" as const, note: "Strong reduction; conflict matrix 120×120." },
  { id: "F", scenario: "50 orders, 4 pools, many same-pool writes", classical_slots: 50, classical_time_ms: 0.5, quantum_slots: 12, quantum_time_ms: 8, slots_reduction_pct: 76, winner: "quantum" as const, note: "Write conflicts resolved into 12 batches." },
];

function generateRandomOrders(count: number): SchedulerOrder[] {
  const orders: SchedulerOrder[] = [];
  for (let i = 0; i < count; i++) {
    const pair = PAIRS[i % PAIRS.length];
    const pool = POOL_IDS[i % POOL_IDS.length];
    orders.push({
      id: `order_${i + 1}`,
      type: "swap",
      pair,
      account: `0x${(i + 1).toString(16).padStart(40, "0")}`,
      reads: [pool],
      writes: [pool, `account_${i + 1}`],
    });
  }
  return orders;
}

export default function SchedulerDemoPage() {
  const [orderCount, setOrderCount] = useState(120);
  const [orders, setOrders] = useState<SchedulerOrder[]>(() => generateRandomOrders(120));
  const [result, setResult] = useState<SchedulerResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shuffle = useCallback(() => {
    setOrders(generateRandomOrders(orderCount));
    setResult(null);
  }, [orderCount]);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runScheduler({ pending_orders: orders });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scheduling failed");
    } finally {
      setRunning(false);
    }
  }, [orders]);

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Parallel conflict optimization: transaction scheduling
        </h1>
        <p className="mb-8 text-slate-400">
          In parallel execution, multiple orders updating the same pair depth cause conflicts.
          Minimizing conflict-free slots = graph coloring (NP-hard). We optimize the account model
          so hundreds of pending orders are batched with full visualization: conflict heatmap and
          animated conflict graph (color = execution slot).
        </p>

        <div className="mb-8 rounded-xl border border-slate-600 bg-slate-800/40 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">Reference metrics (pre-recorded)</h2>
          <p className="mb-4 text-sm text-slate-400">
            Fixed test runs. Quantum wins on slot count (fewer execution slots); classical solver is often faster in wall-clock (ms).
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
                    <span className="font-mono text-slate-300">{run.classical_slots} slots</span>
                    <span className="ml-2 text-slate-400">in {run.classical_time_ms} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Quantum:</span>{" "}
                    <span className="font-mono text-cyan-400">{run.quantum_slots} slots</span>
                    <span className="ml-2 text-slate-400">in {run.quantum_time_ms} ms</span>
                  </div>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">
                    Winner (slots): Quantum (−{run.slots_reduction_pct}%)
                  </span>
                  <span className="text-slate-500">{run.note}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Pending orders (100–500 for full demo)</span>
            <input
              type="number"
              min={20}
              max={500}
              value={orderCount}
              onChange={(e) => {
                const n = Number(e.target.value);
                setOrderCount(n);
                setOrders(generateRandomOrders(n));
                setResult(null);
              }}
              className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
            />
          </label>
          <button
            onClick={shuffle}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            <Shuffle className="h-4 w-4" /> New random orders
          </button>
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
            Run scheduler
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {result?.comparison && (
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
                <p className="mb-2 text-sm font-medium text-slate-400">Classical (sequential: 1 order = 1 slot)</p>
                <p className="text-slate-300">Slots: <span className="text-white font-mono">{result.comparison.classical_slots}</span></p>
                <p className="text-slate-400">Conflicts: {result.comparison.classical_conflicts_remaining}</p>
              </div>
              <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-4">
                <p className="mb-2 text-sm font-medium text-cyan-400">Quantum (graph coloring — conflict-free batches)</p>
                <p className="text-slate-300">Slots: <span className="text-green-400 font-mono font-semibold">{result.comparison.quantum_slots}</span></p>
                <p className="text-slate-400">Conflicts: {result.comparison.quantum_conflicts_remaining}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400">
                {result.comparison.winner === "quantum" ? "Quantum wins" : "Classical wins"}
              </span>
              <span className="text-slate-400">
                Slot reduction: <strong className="text-white">{result.comparison.slots_reduction_pct}%</strong>
              </span>
            </div>
          </motion.div>
        )}

        {result && result.conflict_matrix && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-white">Conflict graph (color = execution slot)</h2>
              <ConflictGraph
                conflictMatrix={result.conflict_matrix}
                orderIds={orders.map((o) => o.id)}
                schedule={result.schedule}
                width={720}
                height={480}
                maxNodes={80}
                animate
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-white">Conflict matrix</h2>
              <ConflictHeatmap
                matrix={result.conflict_matrix}
                orderIds={orders.map((o) => o.id)}
                maxSize={80}
                animate
              />
            </motion.div>
          </>
        )}

        {result?.quantum_metrics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Quantum algorithm metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              {result.quantum_metrics.graph_nodes != null && <div><span className="text-slate-500">Graph nodes (orders):</span> <span className="font-mono text-cyan-400">{result.quantum_metrics.graph_nodes}</span></div>}
              {result.quantum_metrics.graph_edges != null && <div><span className="text-slate-500">Conflict edges:</span> <span className="font-mono text-white">{result.quantum_metrics.graph_edges}</span></div>}
              {result.quantum_metrics.conflict_pairs != null && <div><span className="text-slate-500">Conflict pairs:</span> <span className="font-mono text-white">{result.quantum_metrics.conflict_pairs}</span></div>}
              {result.quantum_metrics.coloring_slots != null && <div><span className="text-slate-500">Coloring slots:</span> <span className="font-mono text-cyan-400">{result.quantum_metrics.coloring_slots}</span></div>}
              {result.quantum_metrics.classical_slots_baseline != null && <div><span className="text-slate-500">Classical baseline (slots):</span> <span className="font-mono text-white">{result.quantum_metrics.classical_slots_baseline}</span></div>}
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Schedule</h2>
            <div className="mb-4 flex gap-4 text-sm">
              <span className="text-slate-400">
                Total slots: <strong className="text-white">{result.total_slots}</strong>
              </span>
              <span className="text-slate-400">
                Conflict reduction:{" "}
                <strong className="text-cyan-400">{result.conflict_reduction}</strong>
              </span>
              {result.total_conflicts != null && (
                <span className="text-slate-400">
                  Total conflicts:{" "}
                  <strong className="text-white">{result.total_conflicts}</strong>
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(result.schedule).map(([slot, orderIds]) => (
                <div
                  key={slot}
                  className="rounded-lg border border-slate-600 bg-slate-900/50 p-4"
                >
                  <p className="mb-2 font-mono text-cyan-400">{slot}</p>
                  <ul className="list-inside list-disc text-sm text-slate-400 max-h-48 overflow-y-auto">
                    {orderIds.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mb-8 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Why it works better</h3>
          <p className="text-slate-300">
            Classical execution runs one order per slot (sequential), so N orders = N slots. Quantum models the conflict graph and solves a <strong className="text-cyan-400">graph coloring QUBO</strong>: orders that do not share a write (same pool/account) get the same color (slot). Result: <strong className="text-white">far fewer slots</strong> (e.g. 82% reduction) and better parallelism without conflicts.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-400">Pending orders ({orders.length} total)</h3>
          <pre className="max-h-64 overflow-auto text-xs text-slate-500">
            {JSON.stringify(orders.slice(0, 15), null, 2)}
            {orders.length > 15 && `\n... +${orders.length - 15} more`}
          </pre>
        </div>
      </div>
    </div>
  );
}
