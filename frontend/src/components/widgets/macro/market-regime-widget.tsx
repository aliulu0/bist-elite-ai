"use client";

import type { MarketRegimeAnalysis } from "@/types/dashboard";

const regimeColors: Record<string, string> = {
  risk_on: "text-success",
  neutral: "text-yellow-400",
  risk_off: "text-warning",
  extreme_risk: "text-danger",
};

export function MarketRegimeWidget({ regime, isLoading }: { regime?: MarketRegimeAnalysis; isLoading: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted">Market Regime</h3>
      {isLoading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-surface" />
      ) : regime ? (
        <>
          <p className={`mt-1 text-lg font-bold ${regimeColors[regime.regime] || "text-text"}`}>
            {regime.regime.replace("_", " ").toUpperCase()}
          </p>
          <p className="text-xs text-muted">Score: {regime.score}/100</p>
          {regime.signals.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {regime.signals.map((s, i) => (
                <li key={i} className="text-xs text-muted">{s}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-2 text-xs text-muted">No data available</p>
      )}
    </div>
  );
}
