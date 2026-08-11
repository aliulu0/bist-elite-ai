"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { useMacroData } from "@/hooks";

const statusColors: Record<string, string> = {
  fetched: "text-success",
  stale: "text-yellow-400",
  error: "text-danger",
  pending: "text-muted",
};

const CATEGORIES: Record<string, { label: string; sources: string[] }> = {
  risk: { label: "Risk Indicators", sources: ["vix", "dxy", "us10y", "turkey_cds"] },
  commodity: { label: "Commodities", sources: ["gold", "brent"] },
  currency: { label: "Currency", sources: ["usdtry", "eurusd"] },
  macro: { label: "Macro Data", sources: ["inflation", "pmi"] },
};

export default function GlobalIndicatorsPage() {
  const { data, isLoading } = useMacroData();

  const categorized = data
    ? Object.entries(CATEGORIES).map(([key, cat]) => ({
        ...cat,
        points: data.points.filter((p) => cat.sources.includes(p.source)),
      }))
    : [];

  return (
    <MainLayout>
      <PageHeader
        title="Global Indicators"
        subtitle="Real-time global market indicators, commodities, and macro data"
      />

      {data && (
        <p className="mb-6 text-xs text-muted">
          Last updated: {new Date(data.fetchedAt).toLocaleString()} |{" "}
          {data.healthyCount}/{data.sourceCount} sources healthy
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 h-5 w-32 animate-pulse rounded bg-surface" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 animate-pulse rounded bg-surface" />
                  ))}
                </div>
              </div>
            ))
          : categorized.map((cat) => (
              <div key={cat.label} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-text">{cat.label}</h3>
                <div className="space-y-3">
                  {cat.points.length === 0 ? (
                    <p className="text-xs text-muted">No data available</p>
                  ) : (
                    cat.points.map((p) => (
                      <div
                        key={p.source}
                        className="flex items-center justify-between rounded-lg bg-surface/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-text">{p.label}</p>
                          <p className="text-[10px] text-muted">{p.source}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-text">
                            {p.value} <span className="text-xs font-normal text-muted">{p.unit}</span>
                          </p>
                          {p.change != null && (
                            <p
                              className={`text-xs ${
                                p.change >= 0 ? "text-success" : "text-danger"
                              }`}
                            >
                              {p.change >= 0 ? "+" : ""}
                              {p.change.toFixed(2)}
                            </p>
                          )}
                          <p className={`text-[10px] ${statusColors[p.status] || "text-muted"}`}>
                            {p.status}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
      </div>
    </MainLayout>
  );
}
