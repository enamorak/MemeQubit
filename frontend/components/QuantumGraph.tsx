"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export type Pool = { address: string; tokens: string[]; reserves: number[]; fee?: number };
const TOKEN_LABELS: Record<string, string> = {
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "USDC",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "WETH",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "USDT",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "WBTC",
  "0x6B175474E89094C44Da98b954EedeCB5BE3830": "DAI",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": "LINK",
};
function tokenLabel(addr: string) {
  return TOKEN_LABELS[addr] || addr.slice(0, 6) + "…";
}

interface QuantumGraphProps {
  pools: Pool[];
  optimalPath?: string[] | null;
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}

export function QuantumGraph({
  pools,
  optimalPath = null,
  width = 600,
  height = 400,
  className = "",
  animate = true,
}: QuantumGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !pools.length) return;

    const nodeIds = new Set<string>();
    pools.forEach((p) => p.tokens.forEach((t) => nodeIds.add(t)));
    type NodeDatum = { id: string; label: string; x?: number; y?: number; fx?: number | null; fy?: number | null };
    const nodes: NodeDatum[] = Array.from(nodeIds).map((id) => ({ id, label: tokenLabel(id) }));
    const pathSet = optimalPath ? new Set(optimalPath) : new Set<string>();
    const links: { source: string; target: string; pool: string }[] = [];
    pools.forEach((p) => {
      if (p.tokens.length >= 2) {
        links.push({
          source: p.tokens[0],
          target: p.tokens[1],
          pool: p.address,
        });
      }
    });

    const isOnPath = (d: { source: string; target: string }) => {
      if (!optimalPath || optimalPath.length < 2) return false;
      for (let i = 0; i < optimalPath.length - 1; i++) {
        if (
          (d.source === optimalPath[i] && d.target === optimalPath[i + 1]) ||
          (d.source === optimalPath[i + 1] && d.target === optimalPath[i])
        )
          return true;
      }
      return false;
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", [0, 0, width, height]);

    const g = svg.append("g");
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => (isOnPath(d) ? "#22d3ee" : "#475569"))
      .attr("stroke-width", (d) => (isOnPath(d) ? 3 : 1.5))
      .attr("stroke-opacity", 0.8);

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, NodeDatum>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x ?? 0;
            d.fy = d.y ?? 0;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const circles = node
      .append("circle")
      .attr("r", animate ? 0 : 10)
      .attr("fill", (d) => (pathSet.has(d.id) ? "#22d3ee" : "#6366f1"))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);
    if (animate) {
      circles.transition().duration(500).delay((_, i) => i * 80).attr("r", 10);
    }
    node
      .append("text")
      .attr("dx", 14)
      .attr("dy", 4)
      .attr("font-size", 12)
      .attr("fill", "#e2e8f0")
      .text((d) => d.label);

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum<NodeDatum>[])
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: { id: string }) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        link
          .attr("x1", (d: { source: NodeDatum; target: NodeDatum }) => (d.source as NodeDatum).x ?? 0)
          .attr("y1", (d: { source: NodeDatum; target: NodeDatum }) => (d.source as NodeDatum).y ?? 0)
          .attr("x2", (d: { source: NodeDatum; target: NodeDatum }) => (d.target as NodeDatum).x ?? 0)
          .attr("y2", (d: { source: NodeDatum; target: NodeDatum }) => (d.target as NodeDatum).y ?? 0);
        node.attr("transform", (d: NodeDatum) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    return () => {
      simulation.stop();
    };
  }, [pools, optimalPath, width, height, animate]);

  if (!pools.length) return null;
  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      className={className}
      style={{ maxWidth: width }}
    />
  );
}
