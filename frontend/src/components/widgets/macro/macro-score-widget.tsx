"use client";

import type { MacroScoreResult } from "@/types/dashboard";

export function MacroScoreWidget({ score, isLoading }: { score?: MacroScoreResult; isLoading: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted">Macro Score</h3>
      {isLoading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-surface" />
      ) : score ? (
        <>
          <p className="mt-1 text-2xl font-bold text-text">{score.macroScore}</p>
          <p className="text-xs text-muted">Confidence: {score.confidence}%</p>
          <div className="mt-2 space-y-1">
            {Object.entries(score.components).map(([key, val]) => (
              <div key={key} className="flex justify-between text-xs text-muted">
                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted">No data available</p>
      )}
    </div>
  );
}
