"use client";

import { PageHeader } from "@/components";
import { useMacroScore, useCombinedConfidence, useMacroOpportunities } from "@/hooks";

const priorityColors: Record<string, string> = {
  high: "text-success",
  medium: "text-yellow-400",
  low: "text-muted",
};

const impactColors: Record<string, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-muted",
};

export default function MacroOpportunitiesPage() {
  const { data: score, isLoading: scoreLoading } = useMacroScore();
  const { data: confidence, isLoading: confLoading } = useCombinedConfidence(65);
  const { data: opportunities, isLoading: oppLoading } = useMacroOpportunities();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Macro Opportunities"
        description="Elite Score, Macro Score, and Combined Confidence displayed side by side"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted">Elite Score</h3>
          <p className="mt-2 text-4xl font-bold text-text">
            {confidence ? confidence.eliteScore : "--"}
          </p>
          <p className="mt-1 text-xs text-muted">Deterministic ranking score</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted">Macro Score</h3>
          <p className="mt-2 text-4xl font-bold text-text">
            {score ? score.macroScore : "--"}
          </p>
          <p className="mt-1 text-xs text-muted">Macroeconomic conditions (0-100)</p>
          {score && (
            <div className="mt-3 space-y-1 text-xs text-muted">
              <p>Monetary Policy: {score.components.monetaryPolicy}</p>
              <p>Global Risk: {score.components.globalRisk}</p>
              <p>Domestic Risk: {score.components.domesticRisk}</p>
              <p>Growth: {score.components.growth}</p>
              <p>Liquidity: {score.components.liquidity}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted">Combined Confidence</h3>
          <p className="mt-2 text-4xl font-bold text-text">
            {confidence ? confidence.combined : "--"}
          </p>
          <p className="mt-1 text-xs text-muted">Weighted combination (visualization only)</p>
          {confidence && (
            <div className="mt-3 space-y-1 text-xs text-muted">
              <p>Elite weight: {(confidence.weightElite * 100).toFixed(0)}%</p>
              <p>Macro weight: {(confidence.weightMacro * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>
      </div>

      {score && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-text">Macro Score Components</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(score.components).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span>{value}/100</span>
                </div>
                <div className="h-2 rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {opportunities && opportunities.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text">Opportunity List</h3>
            <span className="text-xs text-muted">{opportunities.length} opportunities</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted font-medium">Ticker</th>
                  <th className="text-left py-2 px-3 text-muted font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-muted font-medium">Sector</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Elite</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Macro</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Combined</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Sector Impact</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.ticker} className="border-b border-border hover:bg-surface/50">
                    <td className="py-2 px-3 font-medium text-text">{opp.ticker}</td>
                    <td className="py-2 px-3 text-text">{opp.name}</td>
                    <td className="py-2 px-3 text-muted">{opp.sector}</td>
                    <td className="py-2 px-3 text-right text-text">{opp.eliteScore}</td>
                    <td className="py-2 px-3 text-right text-text">{opp.macroScore.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-text">{opp.combinedConfidence.toFixed(0)}</td>
                    <td className={`py-2 px-3 text-right ${impactColors[opp.sectorImpact]}`}>
                      {opp.sectorImpact.toUpperCase()}
                    </td>
                    <td className={`py-2 px-3 text-right ${priorityColors[opp.priority]}`}>
                      {opp.priority.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
