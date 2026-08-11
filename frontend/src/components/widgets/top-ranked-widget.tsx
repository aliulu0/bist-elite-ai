"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRanking } from "@/hooks";
import { formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function TopRankedWidget() {
  const { data, isLoading } = useRanking(1, 5);

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Ranked Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-border/50"
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
        <CardTitle>Top Ranked Stocks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.items.map((stock) => (
            <Link
              key={stock.symbol}
              href={`/stocks/${stock.symbol}`}
              className="flex items-center justify-between rounded-xl bg-background/50 p-3 transition-all hover:bg-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  #{stock.rank}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">
                    {stock.symbol}
                  </p>
                  <p className="text-xs text-muted">{stock.sector}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-text">
                    {stock.score.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted">Score</p>
                </div>
                <div className="flex items-center gap-1">
                  {stock.changePercent > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : stock.changePercent < 0 ? (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      stock.changePercent >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatPercent(stock.changePercent)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
