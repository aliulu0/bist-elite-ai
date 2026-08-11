"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOpportunities } from "@/hooks";

export function LatestOpportunitiesWidget() {
  const { data, isLoading } = useOpportunities();

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-border/50"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = data.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Opportunities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {latest.map((opp) => (
            <Link
              key={opp.id}
              href={`/stocks/${opp.symbol}`}
              className="block rounded-xl bg-background/50 p-3 transition-all hover:bg-border/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-text">
                  {opp.symbol}
                </span>
                <Badge
                  variant={
                    opp.confidence >= 70
                      ? "success"
                      : opp.confidence >= 40
                        ? "warning"
                        : "danger"
                  }
                >
                  {opp.confidence}%
                </Badge>
              </div>
              <p className="mb-1 line-clamp-2 text-xs text-muted">
                {opp.reasons[0]}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary">Score: {opp.score}</span>
                <span className="text-xs text-muted">|</span>
                <span className="text-xs capitalize text-muted">{opp.type}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
