"use client";

import { useMemo } from "react";

interface ConflictHeatmapProps {
  matrix: number[][];
  orderIds?: string[];
  maxSize?: number;
  className?: string;
  animate?: boolean;
}

export function ConflictHeatmap({
  matrix,
  orderIds = [],
  maxSize = 60,
  className = "",
  animate = true,
}: ConflictHeatmapProps) {
  const { cells, size } = useMemo(() => {
    const n = matrix.length;
    if (n === 0) return { cells: [], size: 0 };
    const cap = Math.min(n, maxSize);
    const cells: { i: number; j: number; value: number; index: number }[] = [];
    for (let i = 0; i < cap; i++) {
      for (let j = 0; j < cap; j++) {
        cells.push({ i, j, value: matrix[i]?.[j] ?? 0, index: i * cap + j });
      }
    }
    return { cells, size: cap };
  }, [matrix, maxSize]);

  if (size === 0) return null;

  const cellSize = Math.max(4, Math.min(12, 400 / size));

  return (
    <div className={className}>
      <p className="mb-2 text-sm text-slate-400">
        Conflict matrix (1 = conflict between orders). Showing first {size}×{size}.
      </p>
      <div
        className="inline-grid gap-px rounded border border-slate-700 bg-slate-800 p-1 overflow-x-auto max-w-full"
        style={{
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
        }}
      >
        {cells.map(({ i, j, value, index }) => (
          <div
            key={`${i}-${j}`}
            title={
              orderIds[i] && orderIds[j]
                ? `${orderIds[i]} vs ${orderIds[j]}: ${value ? "conflict" : "no conflict"}`
                : `${i} vs ${j}: ${value}`
            }
            className="rounded-sm transition hover:ring-2 hover:ring-cyan-400"
            className={animate ? "animate-heatmap-cell" : ""}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: value ? "rgba(99, 102, 241, 0.8)" : "rgba(30, 41, 59, 0.6)",
              animationDelay: animate ? `${Math.min(index * 1.5, 400)}ms` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
