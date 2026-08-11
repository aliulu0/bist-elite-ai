"use client";

import Link from "next/link";
import { useOpportunities } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useState } from "react";

const confidenceColors: Record<string, "success" | "warning" | "danger"> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "danger",
};

function getConfidenceLevel(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export function OpportunityList() {
  const [minConfidence, setMinConfidence] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data, isLoading } = useOpportunities(
    minConfidence ? Number(minConfidence) : undefined,
    typeFilter || undefined,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <p>No opportunities detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select
          label=""
          value={minConfidence}
          onChange={(e) => setMinConfidence(e.target.value)}
          options={[
            { value: "", label: "All Confidence" },
            { value: "70", label: "High (70+)" },
            { value: "40", label: "Medium (40+)" },
            { value: "0", label: "Low (0+)" },
          ]}
        />
        <Select
          label=""
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: "", label: "All Types" },
            { value: "VALUE", label: "Value" },
            { value: "GROWTH", label: "Growth" },
            { value: "MOMENTUM", label: "Momentum" },
            { value: "DIVIDEND", label: "Dividend" },
          ]}
        />
      </div>

      {data.map((opp) => (
        <Link
          key={opp.id}
          href={`/stocks/${opp.symbol}`}
          className="block rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-text">
                  {opp.symbol}
                </span>
                <span className="text-sm text-muted">{opp.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={confidenceColors[getConfidenceLevel(opp.confidence)]}
                >
                  {opp.confidence}% Confidence
                </Badge>
                <Badge variant="primary">Score: {opp.score}</Badge>
                <span className="text-xs capitalize text-muted">{opp.type}</span>
              </div>
            </div>
          </div>

          {opp.reasons.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                Reasons
              </p>
              <ul className="space-y-1">
                {opp.reasons.map((r, i) => (
                  <li key={i} className="text-sm text-text">
                    • {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {opp.strengths.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-success">Strengths</p>
                <ul className="space-y-0.5">
                  {opp.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-muted">
                      ✓ {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {opp.weaknesses.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-danger">Weaknesses</p>
                <ul className="space-y-0.5">
                  {opp.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-muted">
                      ✗ {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
