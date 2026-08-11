"use client";

import type { SectorImpact } from "@/types/dashboard";

const impactColors: Record<string, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-muted",
};

export function SectorImpactWidget({ sectors, isLoading }: { sectors?: SectorImpact[]; isLoading: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted">Sector Impact</h3>
      {isLoading ? (
        <div className="mt-2 space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-surface" />)}
        </div>
      ) : sectors ? (
        <div className="mt-2 space-y-2">
          {sectors.map((s) => (
            <div key={s.sector} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text">{s.sector}</p>
                <p className="text-[10px] text-muted">{s.score}/100</p>
              </div>
              <span className={`text-xs font-bold ${impactColors[s.impact]}`}>
                {s.impact.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">No data available</p>
      )}
    </div>
  );
}
