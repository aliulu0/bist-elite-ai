"use client";

import { PageHeader } from "@/components";
import { useMacroData } from "@/hooks";

const statusColors: Record<string, string> = {
  fetched: "text-success",
  stale: "text-yellow-400",
  error: "text-danger",
  pending: "text-muted",
};

export default function MacroTimelinePage() {
  const { data, isLoading } = useMacroData();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Macro Timeline"
        description="Latest macroeconomic data points with timestamps"
      />

      {data && (
        <p className="text-xs text-muted">
          Last fetched: {new Date(data.fetchedAt).toLocaleString()} |{" "}
          {data.healthyCount}/{data.sourceCount} sources healthy
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">Source</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Value</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Change</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Unit</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.points.map((point) => (
              <tr key={point.source} className="border-b border-border hover:bg-surface/50">
                <td className="py-2 px-3 text-text">{point.label}</td>
                <td className="py-2 px-3 text-right text-text">{point.value}</td>
                <td className={`py-2 px-3 text-right ${point.change && point.change >= 0 ? "text-success" : "text-danger"}`}>
                  {point.change != null ? (point.change >= 0 ? "+" : "") + point.change.toFixed(2) : "--"}
                </td>
                <td className="py-2 px-3 text-right text-muted">{point.unit}</td>
                <td className={`py-2 px-3 text-right ${statusColors[point.status] || "text-muted"}`}>
                  {point.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
