"use client";

import type { MarketRegimeAnalysis } from "@/types/dashboard";

export function RiskAppetiteWidget({ regime, isLoading }: { regime?: MarketRegimeAnalysis; isLoading: boolean }) {
  const level = regime?.regime === "risk_on" ? "High" : regime?.regime === "neutral" ? "Moderate" : regime?.regime === "risk_off" ? "Low" : "Extreme";
  const color = regime?.regime === "risk_on" ? "text-success" : regime?.regime === "neutral" ? "text-yellow-400" : regime?.regime === "risk_off" ? "text-warning" : "text-danger";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted">Risk Appetite</h3>
      {isLoading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-surface" />
      ) : (
        <>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{level}</p>
          <p className="text-xs text-muted">Based on VIX, DXY, CDS, yields</p>
        </>
      )}
    </div>
  );
}
