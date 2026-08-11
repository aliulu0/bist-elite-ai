"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuickSearch } from "@/hooks/use-dashboard";
import type { QuickSearchResult } from "@/types/dashboard";

export function QuickSearch({ onTickerSelect }: { onTickerSelect?: (ticker: string) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the search query
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => {
      setDebouncedQuery(value.toUpperCase());
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, error } = useQuickSearch(debouncedQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Type ticker (e.g., ASELS, THYAO, GARAN)..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="text-lg font-mono"
          autoComplete="off"
        />

        {debouncedQuery && (
          <div className="pt-2">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Error loading data for {debouncedQuery}
              </div>
            ) : !data ? (
              <div className="text-center py-8 text-muted-foreground">
                No data found for {debouncedQuery}
              </div>
            ) : (
              <QuickSearchResultDisplay data={data} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickSearchResultDisplay({ data }: { data: QuickSearchResult }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4 text-xs">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeframes">Timeframes</TabsTrigger>
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
        <TabsTrigger value="backtest">Backtest</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="Bullish %" value={`${data.prediction.bullishPercent}%`} />
          <MetricCard label="Confidence" value={`${data.prediction.confidence}%`} />
          <MetricCard label="Exp. Return" value={`${data.prediction.expectedReturn.toFixed(1)}%`} />
          <MetricCard label="Trend" value={data.prediction.trend} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="Momentum" value={data.prediction.momentum} />
          <MetricCard label="Smart Money" value={`${data.smartMoney.score} (${data.smartMoney.accumulation})`} />
          <MetricCard label="Catalyst" value={`${data.catalyst.score} ${data.catalyst.verified ? "✓" : "✗"}`} />
          <MetricCard label="Verification" value={data.verification.status} />
        </div>

        <div className="p-3 bg-muted/30 rounded">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Entry & Targets</h4>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center p-2 bg-green-500/10 rounded text-green-400">
              Entry<br />
              <span className="font-mono">{data.entry.zone ? `${data.entry.zone.min.toFixed(2)}-${data.entry.zone.max.toFixed(2)}` : "-"}</span>
            </div>
            <div className="text-center p-2 bg-red-500/10 rounded text-red-400">
              Stop<br />
              <span className="font-mono">{data.entry.stop?.toFixed(2) ?? "-"}</span>
            </div>
            <div className="text-center p-2 bg-blue-500/10 rounded text-blue-400">
              Target 1<br />
              <span className="font-mono">{data.entry.target1?.toFixed(2) ?? "-"}</span>
            </div>
            <div className="text-center p-2 bg-purple-500/10 rounded text-purple-400">
              Target 2<br />
              <span className="font-mono">{data.entry.target2?.toFixed(2) ?? "-"}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted/30 rounded">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Research Consensus</h4>
          <p className="text-sm">{data.research.consensus}</p>
          <p className="text-xs text-muted-foreground">Agreement: {data.research.agreementLevel}%</p>
        </div>
      </TabsContent>

      <TabsContent value="timeframes" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2">Timeframe</th>
                <th className="pb-2">Bullish %</th>
                <th className="pb-2">Confidence</th>
                <th className="pb-2">Exp. Return</th>
                <th className="pb-2">Trend</th>
                <th className="pb-2">Momentum</th>
              </tr>
            </thead>
            <tbody>
              {data.multiTimeframe.timeframes.map((tf) => (
                <tr key={tf} className="border-b">
                  <td className="py-2 font-mono font-medium">{tf}</td>
                  <td className="py-2">{data.multiTimeframe.scores[tf]?.toFixed(1) ?? "-"}%</td>
                  <td className="py-2">-</td>
                  <td className="py-2">-</td>
                  <td className="py-2">-</td>
                  <td className="py-2">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="analysis" className="mt-4 space-y-4">
        <div className="p-3 bg-muted/30 rounded">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Catalyst Analysis</h4>
          <p className="text-sm">{data.catalyst.summary}</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span>Score: <strong>{data.catalyst.score}</strong></span>
            <Badge variant={data.catalyst.verified ? "default" : "outline"}>
              {data.catalyst.verified ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </div>

        <div className="p-3 bg-muted/30 rounded">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Smart Money</h4>
          <p className="text-sm">Accumulation: <strong>{data.smartMoney.accumulation}</strong></p>
          <p className="text-xs text-muted-foreground">Score: {data.smartMoney.score}</p>
        </div>
      </TabsContent>

      <TabsContent value="backtest" className="mt-4">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Win Rate" value={`${data.backtest.winRate}%`} />
          <MetricCard label="Total Trades" value={data.backtest.totalTrades.toString()} />
          <MetricCard label="Sharpe Ratio" value={data.backtest.sharpeRatio.toFixed(2)} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-muted/30 rounded">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}