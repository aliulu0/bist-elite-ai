"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { usePipelineMetrics, useMacroScore, useMacroData, useMarketRegime, useMacroAlerts } from "@/hooks";

export default function ProductionObservabilityPage() {
  const { data: pipeline, isLoading: plLoading } = usePipelineMetrics();
  const { data: macroScore, isLoading: msLoading } = useMacroScore();
  const { data: macroData, isLoading: mdLoading } = useMacroData();
  const { data: regime, isLoading: rgLoading } = useMarketRegime();
  const { data: alerts, isLoading: alLoading } = useMacroAlerts();

  const isLoading = plLoading || msLoading || mdLoading || rgLoading || alLoading;

  return (
    <MainLayout>
      <PageHeader
        title="Production Observability"
        subtitle="System health, pipeline metrics, and data freshness at a glance"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-medium text-muted">Pipeline Health</h3>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Duration</span>
                <span className="text-text">{pipeline ? `${(pipeline.pipelineDurationMs / 1000).toFixed(1)}s` : "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Failures</span>
                <span className={pipeline && pipeline.providerFailures > 0 ? "text-danger" : "text-success"}>
                  {pipeline?.providerFailures ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Macro Refresh</span>
                <span className="text-text">{pipeline ? `${pipeline.macroRefreshDurationMs}ms` : "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Last Macro Update</span>
                <span className="text-text">
                  {pipeline?.macroUpdateTimestamp
                    ? new Date(pipeline.macroUpdateTimestamp).toLocaleTimeString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-medium text-muted">Macro Score</h3>
            <p className="mt-2 text-3xl font-bold text-text">{macroScore?.macroScore ?? "--"}</p>
            <p className="text-xs text-muted">Confidence: {macroScore?.confidence ?? "--"}%</p>
            <div className="mt-3 space-y-1">
              {macroScore && Object.entries(macroScore.components).map(([key, val]) => (
                <div key={key} className="flex justify-between text-xs text-muted">
                  <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-medium text-muted">Market Regime</h3>
            <p className={`mt-2 text-2xl font-bold ${
              regime?.regime === "risk_on" ? "text-success" :
              regime?.regime === "neutral" ? "text-yellow-400" :
              regime?.regime === "risk_off" ? "text-warning" : "text-danger"
            }`}>
              {regime ? regime.regime.replace(/_/g, " ").toUpperCase() : "--"}
            </p>
            <p className="text-xs text-muted">Score: {regime?.score ?? "--"}/100</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-medium text-muted">Data Sources</h3>
            {macroData ? (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-success">Healthy</span>
                  <span className="text-text">{macroData.healthyCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-400">Stale</span>
                  <span className="text-text">{macroData.staleCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-danger">Errors</span>
                  <span className="text-text">{macroData.errorCount}</span>
                </div>
                <div className="mt-2 border-t border-border pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Total</span>
                    <span className="text-text">{macroData.sourceCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">No data</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-medium text-muted">Active Alerts</h3>
            <p className={`mt-2 text-3xl font-bold ${alerts && alerts.length > 0 ? "text-warning" : "text-success"}`}>
              {alerts?.length ?? 0}
            </p>
            <p className="text-xs text-muted">Macro alerts currently active</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-medium text-muted">System Status</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-xs text-text">Pipeline Service</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-xs text-text">Macro Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-xs text-text">Data Providers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${macroData && macroData.errorCount > 0 ? "bg-warning" : "bg-success"}`} />
                <span className="text-xs text-text">Data Freshness</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
