"use client";

import { PageHeader } from "@/components";
import { useMacroFullAnalysis, useMacroAlerts, useMacroRisk } from "@/hooks";

const severityColors: Record<string, string> = {
  risk_on: "text-success",
  neutral: "text-yellow-400",
  risk_off: "text-warning",
  extreme_risk: "text-danger",
};

const riskTypeLabels: Record<string, string> = {
  rate_sensitive: "Rate Sensitive",
  currency_sensitive: "Currency Sensitive",
  global_risk_exposed: "Global Risk Exposed",
  weak_sector: "Weak Sector",
  high_macro_risk: "High Macro Risk",
};

function RiskCard({ label, value, status }: { label: string; value: string; status: "low" | "moderate" | "high" | "extreme" }) {
  const colorMap: Record<string, string> = {
    low: "text-success",
    moderate: "text-yellow-400",
    high: "text-warning",
    extreme: "text-danger",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-lg font-bold ${colorMap[status] || "text-text"}`}>{value}</p>
      <p className="text-xs capitalize text-muted">{status}</p>
    </div>
  );
}

export default function MacroRiskPage() {
  const { data, isLoading } = useMacroFullAnalysis();
  const { data: alerts } = useMacroAlerts();
  const { data: riskItems } = useMacroRisk();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Macro Risk"
        description="Current macroeconomic risk assessment"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RiskCard
          label="Market Regime"
          value={data?.regime.regime.replace("_", " ").toUpperCase() || "--"}
          status={data?.regime.regime === "extreme_risk" ? "extreme" : data?.regime.regime === "risk_off" ? "high" : data?.regime.regime === "neutral" ? "moderate" : "low"}
        />
        <RiskCard
          label="CDS Risk"
          value={data ? `${data.regime.components.cds.value} bps` : "--"}
          status={data && data.regime.components.cds.value >= 400 ? "extreme" : data && data.regime.components.cds.value >= 300 ? "high" : data && data.regime.components.cds.value >= 200 ? "moderate" : "low"}
        />
        <RiskCard
          label="VIX Volatility"
          value={data ? `${data.regime.components.vix.value}` : "--"}
          status={data && data.regime.components.vix.value >= 40 ? "extreme" : data && data.regime.components.vix.value >= 25 ? "high" : data && data.regime.components.vix.value >= 20 ? "moderate" : "low"}
        />
        <RiskCard
          label="Liquidity"
          value={data?.tcmb.liquidity || "--"}
          status={data?.tcmb.risk as "low" | "moderate" | "high" | "extreme" || "moderate"}
        />
      </div>

      {riskItems && riskItems.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text">Risk Breakdown</h3>
            <span className="text-xs text-muted">{riskItems.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-muted font-medium">Sector</th>
                  <th className="text-left py-2 px-3 text-muted font-medium">Type</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Macro Score</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {riskItems.map((item, i) => (
                  <tr key={`${item.ticker}-${i}`} className="border-b border-border hover:bg-surface/50">
                    <td className="py-2 px-3 font-medium text-text">
                      <p>{item.name}</p>
                      <p className="text-[10px] text-muted">{item.riskDescription}</p>
                    </td>
                    <td className="py-2 px-3 text-muted">{item.sector}</td>
                    <td className="py-2 px-3 text-muted">{riskTypeLabels[item.riskType] || item.riskType}</td>
                    <td className="py-2 px-3 text-right text-text">{item.macroScore.toFixed(1)}</td>
                    <td className={`py-2 px-3 text-right font-medium ${severityColors[item.severity] || "text-text"}`}>
                      {item.severity.replace("_", " ").toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {alerts && alerts.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-text mb-3">Active Macro Alerts</h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 rounded-lg bg-surface p-3">
                <span className={`text-lg ${alert.severity === "critical" ? "text-danger" : alert.severity === "warning" ? "text-warning" : "text-info"}`}>
                  {alert.severity === "critical" ? "!!" : alert.severity === "warning" ? "!" : "i"}
                </span>
                <div>
                  <p className="text-sm font-medium text-text">{alert.title}</p>
                  <p className="text-xs text-muted">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
