"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks";
import { formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, Activity } from "lucide-react";

export function MarketStatusWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded-xl bg-border/50" />
        </CardContent>
      </Card>
    );
  }

  const { marketStatus } = data;
  const isUp = marketStatus.change >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              isUp ? "bg-success/10" : "bg-danger/10"
            }`}
          >
            {isUp ? (
              <TrendingUp className="h-7 w-7 text-success" />
            ) : (
              <TrendingDown className="h-7 w-7 text-danger" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-text">{marketStatus.market}</p>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  isUp ? "text-success" : "text-danger"
                }`}
              >
                {formatPercent(marketStatus.change)}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted">
                <Clock className="h-3 w-3" />
                {marketStatus.status}
              </span>
            </div>
          </div>
          <Activity className="h-6 w-6 text-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
