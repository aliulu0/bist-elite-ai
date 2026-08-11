"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { usePipelineStatus, useRunPipeline, useResetPipeline } from "@/hooks";

function StepBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-success/20 text-success",
    running: "bg-blue-500/20 text-blue-400",
    failed: "bg-danger/20 text-danger",
    pending: "bg-surface text-muted",
    skipped: "bg-surface text-muted",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[status] || "bg-surface text-muted"}`}>
      {status}
    </span>
  );
}

export default function PipelineStatusPage() {
  const { data, isLoading } = usePipelineStatus();
  const runMutation = useRunPipeline();
  const resetMutation = useResetPipeline();

  const metrics = data?.metrics;
  const stepDurations = data?.stepDurations;

  return (
    <MainLayout>
      <PageHeader
        title="Pipeline Status"
        subtitle="Production pipeline health, step durations, and execution metrics"
      />

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {runMutation.isPending ? "Running..." : "Run Pipeline"}
        </button>
        <button
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isPending}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-text"
        >
          Reset Metrics
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Pipeline Duration</p>
              <p className="mt-1 text-2xl font-bold text-text">
                {(metrics.pipelineDurationMs / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Provider Failures</p>
              <p className={`mt-1 text-2xl font-bold ${metrics.providerFailures > 0 ? "text-danger" : "text-success"}`}>
                {metrics.providerFailures}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Macro Refresh</p>
              <p className="mt-1 text-2xl font-bold text-text">
                {metrics.macroRefreshDurationMs}ms
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted">Macro Last Updated</p>
              <p className="mt-1 text-sm font-bold text-text">
                {metrics.macroUpdateTimestamp
                  ? new Date(metrics.macroUpdateTimestamp).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-text">Step Durations</h3>
            {stepDurations && Object.keys(stepDurations).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stepDurations).map(([step, ms]) => {
                  const maxMs = Math.max(...Object.values(stepDurations), 1);
                  const pct = maxMs > 0 ? (ms / maxMs) * 100 : 0;
                  return (
                    <div key={step}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted capitalize">{step.replace(/_/g, " ")}</span>
                        <span className="text-text font-medium">{ms}ms</span>
                      </div>
                      <div className="h-2 rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted">No step data yet. Run the pipeline to populate.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">Loading pipeline data...</p>
      )}
    </MainLayout>
  );
}
