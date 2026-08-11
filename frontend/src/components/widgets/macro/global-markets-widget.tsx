"use client";

import type { MacroDataSnapshot } from "@/types/dashboard";

const KEY_SOURCES = ["vix", "dxy", "us10y", "gold", "brent", "usdtry", "turkey_cds"];

export function GlobalMarketsWidget({ data, isLoading }: { data?: MacroDataSnapshot; isLoading: boolean }) {
  const keyPoints = data?.points.filter((p) => KEY_SOURCES.includes(p.source)) ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted">Global Markets</h3>
      {isLoading ? (
        <div className="mt-2 space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-surface" />)}
        </div>
      ) : (
        <div className="mt-2 space-y-1.5">
          {keyPoints.map((p) => (
            <div key={p.source} className="flex justify-between text-xs">
              <span className="text-muted">{p.label}</span>
              <span className="text-text font-medium">
                {p.value} {p.unit}
                {p.change != null && (
                  <span className={p.change >= 0 ? "text-success ml-1" : "text-danger ml-1"}>
                    {p.change >= 0 ? "+" : ""}{p.change.toFixed(1)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
