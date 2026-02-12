"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  AlertTriangle,
  Cpu,
  Database,
  Layers,
  Wallet,
  MapPin,
  CheckCircle2,
  Target,
  Shield,
  LayoutDashboard,
  BarChart2,
  Trophy,
  TrendingDown,
  DollarSign,
  Loader2,
  Clock,
  Calendar,
} from "lucide-react";
import { addMemeQubitToWallet } from "@/lib/memequbit-chain";

export default function HomePage() {
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletAdding, setWalletAdding] = useState(false);

  const handleAddMemeQubit = async () => {
    setWalletError(null);
    setWalletAdding(true);
    try {
      await addMemeQubitToWallet();
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Failed to add network");
    } finally {
      setWalletAdding(false);
    }
  };

  return (
    <div className="bg-memequbit-dark text-slate-200">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.2),transparent)]" />
        <div className="container relative mx-auto px-4 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.p
              className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-white"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Target className="h-8 w-8 text-[#3B82F6]" />
              MEMEQUBIT
            </motion.p>
            <motion.h1
              className="mb-4 text-3xl font-bold tracking-tight text-slate-200 sm:text-4xl md:text-5xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Quantum-AI Copilot for RobinPump.fun Traders
            </motion.h1>
            <motion.p
              className="mb-8 text-xl text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Don&apos;t just be fast. Be quantum.
            </motion.p>
            <motion.div
              className="mb-6 grid gap-4 text-sm sm:grid-cols-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-600/80 bg-slate-800/50 px-4 py-3">
                <Zap className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Classical: 0.52ms</span>
                <span className="text-slate-600">|</span>
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-blue-400">Quantum: +21.3%</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-600/80 bg-slate-800/50 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Slippage: 15–30%</span>
                <span className="text-slate-600">|</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Reduced to 4–8%</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/demo/sniper"
                className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600"
              >
                <Target className="h-5 w-5" />
                Launch Quantum Sniper →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Architecture */}
      <section className="border-b border-white/5 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-semibold text-white">
            System architecture
          </h2>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-xl border border-slate-700/50 bg-slate-900/50 p-8 font-mono text-sm text-slate-400"
          >
            <pre className="overflow-x-auto whitespace-pre">
              {`Frontend (Next.js) → Classical Core API (FastAPI)
         ↓                        ↓
  Quantum Adapter          MemeQubit Gateway
         ↓                        ↓
  Quantum Simulator        MemeQubit / Pump.fun
  (QUBO / Sim. Annealing)  (Base testnet)`}
            </pre>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demos — 3 cards with test results */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-semibold text-white">
            Interactive demos
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Quantum Sniper",
                tagline: "Find winning entries before bots",
                stats: [
                  { icon: BarChart2, text: "Test Run: 20 pools analyzed" },
                  { icon: Zap, text: "Quantum: 82.4 score" },
                  { icon: Cpu, text: "Classical: 68.2 score" },
                  { icon: Trophy, text: "Winner: Quantum (+20.5%)" },
                ],
                href: "/demo/sniper",
                icon: Target,
              },
              {
                title: "Quantum Batching",
                tagline: "Exit large positions without pain",
                stats: [
                  { icon: DollarSign, text: "Position: 10,000 TOKEN" },
                  { icon: Cpu, text: "Classical: 23.4% slippage" },
                  { icon: Zap, text: "Quantum: 6.8% slippage" },
                  { icon: Trophy, text: "Winner: Quantum (-71% slip)" },
                ],
                href: "/demo/batch-exit",
                icon: Layers,
              },
              {
                title: "Quantum Hedge Finder",
                tagline: "Protect your bags from crashes",
                stats: [
                  { icon: TrendingDown, text: "Market drop: -15%" },
                  { icon: Cpu, text: "Classical: -12.4% PnL" },
                  { icon: Zap, text: "Quantum: -3.2% PnL" },
                  { icon: Trophy, text: "Winner: Quantum (74% loss reduction)" },
                ],
                href: "/demo/hedge-finder",
                icon: Shield,
              },
            ].map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 transition hover:border-[#3B82F6]/50 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <Link href={item.href} className="block">
                  <motion.span whileHover={{ rotate: 5 }} className="inline-block">
                    <item.icon className="h-10 w-10 text-[#3B82F6]" />
                  </motion.span>
                  <h3 className="mt-2 mb-1 text-lg font-bold uppercase tracking-wide text-white">{item.title}</h3>
                  <p className="mb-4 text-sm text-slate-400">{item.tagline}</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {item.stats.map((s, j) => (
                      <motion.li
                        key={j}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + j * 0.05 }}
                      >
                        <s.icon className="h-4 w-4 shrink-0 text-slate-500" />
                        {s.text}
                      </motion.li>
                    ))}
                  </ul>
                  <motion.span
                    className="mt-4 inline-flex items-center gap-1 font-medium text-[#3B82F6]"
                    whileHover={{ x: 4 }}
                  >
                    View Demo →
                  </motion.span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology stack */}
      <section className="border-t border-white/5 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-semibold text-white">
            Technology stack
          </h2>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Layers, name: "Next.js 14", desc: "App Router, SSR, API routes" },
              { icon: Cpu, name: "FastAPI", desc: "Classical core API, Pydantic" },
              { icon: Zap, name: "dimod / neal", desc: "QUBO, simulated annealing" },
              { icon: Database, name: "MemeQubit + Redis", desc: "Chain data, pool cache" },
            ].map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex gap-4 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4"
              >
                <tech.icon className="h-8 w-8 shrink-0 text-indigo-400" />
                <div>
                  <p className="font-medium text-white">{tech.name}</p>
                  <p className="text-sm text-slate-400">{tech.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Connect wallet */}
      <section className="border-t border-white/5 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-xl font-semibold text-white">Connect MemeQubit network</h2>
          <p className="mx-auto mb-4 max-w-md text-sm text-slate-400">
            Add MemeQubit testnet to your wallet to use chain data and demo features.
          </p>
          <button
            onClick={handleAddMemeQubit}
            disabled={walletAdding}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-6 py-3 font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
          >
            <Wallet className="h-5 w-5" />
            {walletAdding ? "Adding…" : "Add MemeQubit to MetaMask"}
          </button>
          {walletError && (
            <p className="mt-2 text-sm text-red-400">{walletError}</p>
          )}
        </div>
      </section>

      {/* Documentation & Dashboard */}
      <section className="border-t border-white/5 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/documentation"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-6 py-3 font-medium text-slate-200 hover:bg-slate-700"
            >
              Documentation &amp; conflict diagrams
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-6 py-3 font-medium text-slate-200 hover:bg-slate-700"
            >
              <LayoutDashboard className="h-5 w-5" />
              Live Dashboard &amp; Metrics
            </Link>
          </div>
        </div>
      </section>

      {/* Roadmap — 4 phases per TZ */}
      <section className="border-t border-white/5 bg-slate-900/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-semibold text-white">Roadmap</h2>
          <div className="mx-auto max-w-2xl space-y-4">
            {[
              { phase: "Phase 1", title: "Quantum Sniper — QUBO ranking", status: "complete", Icon: CheckCircle2 },
              { phase: "Phase 2", title: "Quantum Batching — Multi-tx optimization", status: "live", Icon: Loader2 },
              { phase: "Phase 3", title: "Quantum Hedge Finder — Correlation arbitrage", status: "live", Icon: Clock },
              { phase: "Phase 4", title: "Smart Contract Deployment — Base Testnet (Q2 2026)", status: "planned", Icon: Calendar },
            ].map((item, i) => (
              <motion.div
                key={item.phase}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: 4 }}
                className="flex items-center gap-4 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4"
              >
                <item.Icon className={`h-6 w-6 shrink-0 ${item.status === "complete" ? "text-green-400" : item.status === "live" ? "text-blue-400 animate-pulse" : "text-slate-500"}`} />
                <span className="font-mono text-sm text-slate-400">{item.phase}</span>
                <span className="flex-1 text-slate-200">{item.title}</span>
                <span className="text-xs text-slate-500">({item.status})</span>
                {item.status === "complete" && <CheckCircle2 className="h-5 w-5 text-green-400" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="border-t border-white/5 bg-slate-900/50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-2xl items-start gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
            <div className="text-sm text-slate-300">
              <strong className="text-amber-400">Important:</strong> This is an
              experimental research prototype, not a production-ready system. Quantum
              computations are simulated; algorithms are for demonstration. Do not use
              for real trading. MemeQubit testnet integration is for data and
              education only.
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-slate-500">
            MemeQubit · Quantum-AI Copilot for Pump.fun
          </p>
        </div>
      </footer>
    </div>
  );
}
