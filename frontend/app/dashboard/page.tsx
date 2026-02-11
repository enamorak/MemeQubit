"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, Server, Cpu, Fuel } from "lucide-react";
import {
  fetchHealth,
  fetchMemeQubitNetwork,
  fetchMemeQubitPools,
  fetchQuantumStatus,
} from "@/lib/api";

export default function DashboardPage() {
  const [health, setHealth] = useState<{ status: string } | null>(null);
  const [network, setNetwork] = useState<Awaited<ReturnType<typeof fetchMemeQubitNetwork>> | null>(null);
  const [poolsCount, setPoolsCount] = useState<number | null>(null);
  const [quantum, setQuantum] = useState<Awaited<ReturnType<typeof fetchQuantumStatus>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [h, n, pools, q] = await Promise.all([
          fetchHealth(),
          fetchMemeQubitNetwork(),
          fetchMemeQubitPools(),
          fetchQuantumStatus(),
        ]);
        if (!cancelled) {
          setHealth(h);
          setNetwork(n);
          setPoolsCount(Array.isArray(pools) ? pools.length : 0);
          setQuantum(q);
        }
      } catch {
        if (!cancelled) {
          setHealth(null);
          setNetwork(null);
          setPoolsCount(null);
          setQuantum(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-memequbit-dark text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Live Dashboard</h1>
        <p className="mb-8 text-slate-400">
          MemeQubit network stats, API health, quantum simulator status, and metrics.
        </p>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Server className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">API Health</h2>
              </div>
              {health ? (
                <p className="text-green-400">{health.status}</p>
              ) : (
                <p className="text-red-400">Unavailable</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="mb-2 flex items-center gap-2">
                {network?.connected ? (
                  <Wifi className="h-5 w-5 text-green-400" />
                ) : (
                  <WifiOff className="h-5 w-5 text-amber-400" />
                )}
                <h2 className="text-lg font-semibold text-white">MemeQubit Network</h2>
              </div>
              {network ? (
                <>
                  <p className="text-slate-400">
                    Connected:{" "}
                    <span className={network.connected ? "text-green-400" : "text-amber-400"}>
                      {network.connected ? "Yes" : "No"}
                    </span>
                  </p>
                  {network.block_number != null && (
                    <p className="text-slate-400">Block: {network.block_number.toLocaleString()}</p>
                  )}
                  {network.chain_id != null && (
                    <p className="text-slate-400">Chain ID: {network.chain_id}</p>
                  )}
                  {network.message && (
                    <p className="mt-2 text-sm text-slate-500">{network.message}</p>
                  )}
                </>
              ) : (
                <p className="text-red-400">Could not fetch</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Fuel className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Gas</h2>
              </div>
              {network?.gas_price != null && network.gas_price > 0 ? (
                <p className="text-slate-400">
                  Gas price:{" "}
                  <span className="text-white">
                    {(Number(network.gas_price) / 1e9).toFixed(2)} Gwei
                  </span>
                </p>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Quantum Simulator</h2>
              </div>
              {quantum ? (
                <>
                  <p className="text-slate-400">
                    Status:{" "}
                    <span className={quantum.ready ? "text-green-400" : "text-amber-400"}>
                      {quantum.ready ? "Ready" : "—"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{quantum.simulator}</p>
                </>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 sm:col-span-2">
              <h2 className="mb-2 text-lg font-semibold text-white">Cached Pools</h2>
              <p className="text-slate-400">
                Pools available: <span className="text-cyan-400">{poolsCount ?? "—"}</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Updated every 30s from MemeQubit chain or demo data.
              </p>
            </div>
          </div>
        )}

        <p className="mt-8 text-sm text-slate-500">
          TPS (transactions per second) can be estimated from block production rate when
          connected to MemeQubit RPC. Quantum computations in this prototype use classical
          simulators (dimod/neal); real quantum hardware can be integrated via Qiskit/D-Wave
          APIs.
        </p>
      </div>
    </div>
  );
}
