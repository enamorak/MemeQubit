"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export type ScheduleSlotMap = Record<string, string[]>;

interface ConflictGraphProps {
  conflictMatrix: number[][];
  orderIds: string[];
  schedule: ScheduleSlotMap;
  width?: number;
  height?: number;
  maxNodes?: number;
  className?: string;
  animate?: boolean;
}

const SLOT_COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#60a5fa", "#4ade80", "#f97316"];

function getSlotColor(slotIndex: number): string {
  return SLOT_COLORS[slotIndex % SLOT_COLORS.length];
}

export function ConflictGraph({
  conflictMatrix,
  orderIds,
  schedule,
  width = 500,
  height = 400,
  maxNodes = 60,
  className = "",
  animate = true,
}: ConflictGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || conflictMatrix.length === 0) return;

    const n = Math.min(conflictMatrix.length, maxNodes);
    const orderIdToSlot: Record<string, number> = {};
    Object.entries(schedule).forEach(([slotId, ids]) => {
      const slotIndex = parseInt(slotId.replace("slot_", ""), 10) - 1;
      ids.forEach((id) => { orderIdToSlot[id] = slotIndex; });
    });

    type NodeDatum = { id: string; label: string; slotIndex: number; x?: number; y?: number; fx?: number | null; fy?: number | null };
    const nodes: NodeDatum[] = [];
    for (let i = 0; i < n; i++) {
      const id = orderIds[i] ?? `order_${i + 1}`;
      nodes.push({
        id,
        label: id.length > 10 ? id.slice(0, 8) + "…" : id,
        slotIndex: orderIdToSlot[id] ?? 0,
      });
    }

    const links: { source: number; target: number }[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (conflictMatrix[i]?.[j] === 1) {
          links.push({ source: i, target: j });
        }
      }
    }

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
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0)
      .attr("stroke-width", 1)
      .attr("x1", width / 2)
      .attr("y1", height / 2)
      .attr("x2", width / 2)
      .attr("y2", height / 2);

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .style("opacity", animate ? 0 : 1);

    node
      .append("circle")
      .attr("r", 0)
      .attr("fill", (d) => getSlotColor(d.slotIndex))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("font-size", 9)
      .attr("fill", "#94a3b8")
      .text((d) => d.label);

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum<NodeDatum>[])
      .force("link", d3.forceLink(links).distance(60))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .alpha(animate ? 1 : 0.3)
      .on("tick", () => {
        link
          .attr("x1", (d: { source: NodeDatum; target: NodeDatum }) => (d.source as NodeDatum).x ?? 0)
          .attr("y1", (d: { source: NodeDatum; target: NodeDatum }) => (d.source as NodeDatum).y ?? 0)
          .attr("x2", (d: { source: NodeDatum; target: NodeDatum }) => (d.target as NodeDatum).x ?? 0)
          .attr("y2", (d: { source: NodeDatum; target: NodeDatum }) => (d.target as NodeDatum).y ?? 0);
        node.attr("transform", (d: NodeDatum) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    if (animate) {
      node.transition().duration(600).delay((_, i) => i * 8).style("opacity", 1);
      node.select("circle").transition().duration(400).delay((_, i) => i * 8).attr("r", 8);
      link.transition().duration(800).delay(200).attr("stroke-opacity", 0.6);
    } else {
      node.style("opacity", 1);
      node.select("circle").attr("r", 8);
      link.attr("stroke-opacity", 0.6);
    }

    return () => simulation.stop();
  }, [conflictMatrix, orderIds, schedule, width, height, maxNodes, animate]);

  if (conflictMatrix.length === 0) return null;

  const n = Math.min(conflictMatrix.length, maxNodes);
  const slotCount = Object.keys(schedule).length;

  return (
    <div className={className}>
      <p className="mb-2 text-sm text-slate-400">
        Conflict graph: nodes = orders, edges = conflict (same pool/resource). Color = execution slot. Minimum conflict-free slots = graph coloring (NP-hard).
      </p>
      <p className="mb-2 text-xs text-slate-500">
        Showing first {n} nodes. Total slots: {slotCount}.
      </p>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ maxWidth: width }}
      />
    </div>
  );
}
