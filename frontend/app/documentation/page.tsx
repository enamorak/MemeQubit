"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Target, Layers, Shield } from "lucide-react";

export default function DocumentationPage() {
  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <motion.h1
          className="mb-2 text-3xl font-bold text-white flex items-center gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Target className="h-8 w-8 text-[#3B82F6]" />
          MemeQubit: Quantum algorithms for RobinPump.fun traders
        </motion.h1>
        <motion.p
          className="mb-10 text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          This page explains the three core modules and how classical vs quantum-inspired methods are compared on test data. All descriptions in English.
        </motion.p>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="mb-16 rounded-xl border border-slate-700 bg-slate-800/40 p-8"
        >
          <h2 className="mb-2 text-xl font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-[#3B82F6]" />
            1. Quantum Sniper — Optimal entry timing
          </h2>
          <p className="mb-4 text-slate-400">
            <strong>Problem:</strong> When to enter a new RobinPump.fun pool? Bots win on speed but often buy at peaks or on scams. Humans cannot evaluate funding velocity, wallet uniqueness, freshness, and dev activity fast enough.
          </p>
          <p className="mb-4 text-slate-400">
            <strong>Classical:</strong> Sequential rules (IF velocity &gt; X AND uniqueness &gt; Y THEN score += Z). A few factors, threshold-based. Fast but can miss optimal combinations.
          </p>
          <p className="mb-4 text-slate-400">
            <strong>Quantum (QUBO):</strong> All factors are combined in a single weighted sum. Simulated annealing (dimod/neal) evaluates the scoring function over many configurations. Result: a ranking of pools and a &quot;Fly&quot; recommendation (enter or not). We compare ranking order and execution time on the same test data in the <Link href="/demo/sniper" className="text-cyan-400 hover:underline">Sniper demo</Link>.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="mb-16 rounded-xl border border-slate-700 bg-slate-800/40 p-8"
        >
          <h2 className="mb-2 text-xl font-semibold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#3B82F6]" />
            2. Quantum Batching — Optimal exit
          </h2>
          <p className="mb-4 text-slate-400">
            <strong>Problem:</strong> Selling a large meme position in one transaction causes high slippage and sometimes fails. Traders need to split the order across multiple blocks without losing too much to gas.
          </p>
          <p className="mb-4 text-slate-400">
            <strong>Classical:</strong> One transaction (1 tx). Simple but high estimated slippage. No batching.
          </p>
          <p className="mb-4 text-slate-400">
            <strong>Quantum (QUBO scheduling):</strong> The problem is modeled as splitting the position into N batches and assigning each to a &quot;slot&quot; (block or time window). The solver minimizes total price impact (slippage) subject to gas per tx. Result: recommended batch sizes and slot assignment. We compare estimated slippage and gas (classical 1 tx vs quantum N batches) in the <Link href="/demo/batch-exit" className="text-cyan-400 hover:underline">Batch Exit demo</Link>.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="mb-16 rounded-xl border border-slate-700 bg-slate-800/40 p-8"
        >
          <h2 className="mb-2 text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#3B82F6]" />
            3. Quantum Hedge Finder — Best path to stable
          </h2>
          <p className="mb-4 text-slate-400">
            <strong>Problem:</strong> You are long a meme token; the market is falling. What to short or buy to hedge? You need the best path from your token to a stable (or inversely correlated asset) across multiple pools.
          </p>
          <p className="mb-4 text-slate-400">
            <strong>Classical:</strong> Greedy 2-hop path only (e.g. Token A → Token B → USDC). Fast but can miss a better 3–4 hop path on a dense graph of meme + stable assets.
          </p>
          <p className="mb-4 text-slate-400">
            <strong>Quantum (full path search):</strong> We build a graph of tokens and pools (AMM formula for output amount). Quantum-inspired search evaluates all simple paths up to max hops and picks the path that maximizes output (e.g. amount of stable received for 1000 units of held token). Same formulation as arbitrage pathfinding; here the &quot;hedge&quot; is the path to the stable. We compare classical 2-hop vs quantum full path (output amount and path) in the <Link href="/demo/hedge-finder" className="text-cyan-400 hover:underline">Hedge Finder demo</Link>.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-slate-700 bg-slate-800/40 p-8"
        >
          <h2 className="mb-4 text-xl font-semibold text-white">Summary: Classical vs Quantum on test data</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="pb-3 pr-4 text-left text-slate-400">Module</th>
                  <th className="pb-3 pr-4 text-left text-slate-400">Classical</th>
                  <th className="pb-3 pr-4 text-left text-slate-400">Quantum</th>
                  <th className="pb-3 text-left text-slate-400">Demo</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-700">
                  <td className="py-3 pr-4 font-medium text-white">Sniper</td>
                  <td className="py-3 pr-4">Rule-based score (3 factors)</td>
                  <td className="py-3 pr-4">QUBO weighted sum (4 factors), ranking + Fly</td>
                  <td className="py-3"><Link href="/demo/sniper" className="text-cyan-400 hover:underline">/demo/sniper</Link></td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 pr-4 font-medium text-white">Batch Exit</td>
                  <td className="py-3 pr-4">1 tx, high slippage</td>
                  <td className="py-3 pr-4">N batches, lower slippage, more gas</td>
                  <td className="py-3"><Link href="/demo/batch-exit" className="text-cyan-400 hover:underline">/demo/batch-exit</Link></td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 pr-4 font-medium text-white">Hedge Finder</td>
                  <td className="py-3 pr-4">2-hop path to stable</td>
                  <td className="py-3 pr-4">Full path search, global optimum</td>
                  <td className="py-3"><Link href="/demo/hedge-finder" className="text-cyan-400 hover:underline">/demo/hedge-finder</Link></td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
