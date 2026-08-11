"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarketOverview } from "@/hooks/use-dashboard";
import type { MarketOverviewData } from "@/types/dashboard";

export function MarketOverview() {
  const { data, isLoading, error } = useMarketOverview();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center text-destructive">
          Failed to load market overview
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* BIST100 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">BIST 100</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {data.bist100.value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={data.bist100.changePercent >= 0 ? "default" : "destructive"} className="text-xs">
                  {data.bist100.changePercent >= 0 ? "+" : ""}{data.bist100.changePercent.toFixed(2)}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {data.bist100.change >= 0 ? "+" : ""}{data.bist100.change.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              Volume: {formatNumber(data.bist100.volume)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sector Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Sector Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.sectorHeatmap.slice(0, 8).map((sector) => (
              <div key={sector.sector} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[120px]">{sector.sector}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={sector.changePercent >= 0 ? "default" : "destructive"} className="text-xs">
                    {sector.changePercent >= 0 ? "+" : ""}{sector.changePercent.toFixed(2)}%
                  </Badge>
                  <span className="text-muted-foreground">{sector.stocks} stocks</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Gainers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Gainers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topGainers.slice(0, 5).map((stock, i) => (
              <div key={stock.ticker} className="flex items-center justify-between text-xs">
                <span className="font-medium">{i + 1}. {stock.ticker}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">+{stock.changePercent.toFixed(2)}%</Badge>
                  <span className="text-muted-foreground">{stock.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Losers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Losers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topLosers.slice(0, 5).map((stock, i) => (
              <div key={stock.ticker} className="flex items-center justify-between text-xs">
                <span className="font-medium">{i + 1}. {stock.ticker}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">{stock.changePercent.toFixed(2)}%</Badge>
                  <span className="text-muted-foreground">{stock.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 animate-pulse bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-8 w-full animate-pulse bg-muted" />
          <div className="h-4 w-3/4 animate-pulse bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}