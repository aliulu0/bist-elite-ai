"use client";

import { PageHeader } from "@/components";
import { useMarketRegime } from "@/hooks";

const regimeColors: Record<string, string> = {
  risk_on: "text-success",
  neutral: "text-yellow-400",
  risk_off: "text-warning",
  extreme_risk: "text-danger",
};

const regimeLabels: Record<string, string> = {
  risk_on: "Risk On",
  neutral: "Neutral",
  risk_off: "Risk Off",
  extreme_risk: "Extreme Risk",
};

function ImpactBar({ label, value, impact }: { label: string; value: number; impact: number }) {
  const fillColor = impact <= 0.3 ? "bg-success" : impact <= 0.5 ? "bg-yellow-400" : "bg-danger";
  const width = Math.min(100, impact * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-border">
        <div className={`h-full rounded-full ${fillColor} transition-all`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function MarketRegimePage() {
  const { data, isLoading } = useMarketRegime();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Market Regime"
        description="Current market regime analysis based on VIX, DXY, yields, and CDS"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 col-span-full md:col-span-1">
          <p className="text-xs text-muted">Current Regime</p>
          <p className={`mt-2 text-3xl font-bold ${regimeColors[data?.regime || "neutral"]}`}>
            {data ? regimeLabels[data.regime] : "--"}
          </p>
          <p className="mt-1 text-xs text-muted">Regime Score: {data?.score ?? "--"}/100</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 col-span-full md:col-span-2">
          <h3 className="text-sm font-semibold text-text mb-4">Component Impacts</h3>
          <div className="space-y-3">
            {data && Object.entries(data.components).map(([key, comp]) => (
              <ImpactBar
                key={key}
                label={key.toUpperCase()}
                value={comp.value}
                impact={comp.impact}
              />
            ))}
          </div>
        </div>
      </div>

      {data && data.signals.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-text mb-3">Risk Signals</h3>
          <ul className="space-y-1">
            {data.signals.map((signal, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
