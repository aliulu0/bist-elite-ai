"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks";

const recColors: Record<string, "success" | "warning" | "danger" | "primary" | "default"> = {
  STRONG_BUY: "success",
  BUY: "success",
  HOLD: "warning",
  SELL: "danger",
  STRONG_SELL: "danger",
};

export function AIRecommendationsWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl bg-border/50"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.aiRecommendations.map((rec) => (
            <Link
              key={rec.symbol}
              href={`/stocks/${rec.symbol}`}
              className="flex items-center justify-between rounded-xl bg-background/50 p-3 transition-all hover:bg-border/50"
            >
              <span className="text-sm font-semibold text-text">
                {rec.symbol}
              </span>
              <div className="flex items-center gap-3">
                <Badge variant={recColors[rec.recommendation] || "default"}>
                  {rec.recommendation}
                </Badge>
                <span className="text-xs text-muted">{rec.confidence}%</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
