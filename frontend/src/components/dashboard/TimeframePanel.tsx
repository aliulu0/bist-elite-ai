"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEarlyOpportunity } from "@/hooks/use-dashboard";
import { useMultiTimeframeOpportunity } from "@/hooks/use-dashboard";
import type { EarlyOpportunityIntelligenceResult, MultiTimeframeOpportunityResult } from "@/types/dashboard";
import { TIMEFRAMES } from "@/lib/constants";

interface TimeframePanelProps {
  ticker: string;
}

export function TimeframePanel({ ticker }: TimeframePanelProps) {
  const { data: earlyData } = useEarlyOpportunity(ticker);
  const { data: mtfData } = useMultiTimeframeOpportunity(ticker);

  if (!earlyData && !mtfData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a stock to view timeframe analysis
        </CardContent>
      </Card>
    );
  }

  // Merge timeframe data from both sources
  const timeframeData = mergeTimeframeData(earlyData, mtfData);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          Timeframe Panel
          <Badge variant="outline" className="text-xs">
            {ticker}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 text-xs">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="short">Short (1h-4h)</TabsTrigger>
            <TabsTrigger value="medium">Medium (1d-1w)</TabsTrigger>
            <TabsTrigger value="long">Long (1m-6m)</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <TimeframeTable timeframes={TIMEFRAMES} data={timeframeData} />
          </TabsContent>

          <TabsContent value="short" className="mt-4">
            <TimeframeTable timeframes={["1h", "2h", "4h"]} data={timeframeData} />
          </TabsContent>

          <TabsContent value="medium" className="mt-4">
            <TimeframeTable timeframes={["1d", "1w"]} data={timeframeData} />
          </TabsContent>

          <TabsContent value="long" className="mt-4">
            <TimeframeTable timeframes={["1m", "3m", "6m"]} data={timeframeData} />
          </TabsContent>
        </Tabs>

        {/* MTF Summary */}
        {mtfData && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="text-xs font-medium text-muted-foreground mb-3">Multi-Timeframe Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="MTF Score" value={mtfData.multiTimeframeScore.toString()} />
              <MetricCard label="Strength" value={mtfData.strength} />
              <MetricCard label="Trend Stage" value={mtfData.trendStage} />
              <MetricCard label="Holding Type" value={mtfData.holdingType} />
              <MetricCard label="Best TF" value={mtfData.bestTimeframe} />
              <MetricCard label="Worst TF" value={mtfData.worstTimeframe} />
              <MetricCard label="Most Bullish" value={mtfData.mostBullishTimeframe} />
              <MetricCard label="Highest Conf." value={mtfData.highestConfidenceTimeframe} />
            </div>
            <div className="mt-3 p-3 bg-background rounded text-xs">
              <p className="text-muted-foreground">{mtfData.reasons[0] || "Multi-timeframe analysis complete"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function mergeTimeframeData(
  earlyData: EarlyOpportunityIntelligenceResult | null,
  mtfData: MultiTimeframeOpportunityResult | null
): Record<string, TimeframeDisplayData> {
  const result: Record<string, TimeframeDisplayData> = {};

  TIMEFRAMES.forEach((tf) => {
    result[tf] = {
      timeframe: tf,
      bullishPercent: "-",
      confidence: "-",
      expectedReturn: "-",
      trend: "-",
      momentum: "-",
    };
  });

  // Use MTF data if available
  if (mtfData) {
    TIMEFRAMES.forEach((tf) => {
      // We don't have per-timeframe breakdown in the current MTF result
      // but we can show the overall metrics
    });
  }

  // Use early opportunity data for 1d
  if (earlyData) {
    result["1d"] = {
      timeframe: "1d",
      bullishPercent: `${earlyData.bullishPercent}%`,
      confidence: `${earlyData.confidence}%`,
      expectedReturn: `${earlyData.expectedReturn.toFixed(1)}%`,
      trend: earlyData.trend,
      momentum: earlyData.momentum,
    };
  }

  return result;
}

interface TimeframeDisplayData {
  timeframe: string;
  bullishPercent: string;
  confidence: string;
  expectedReturn: string;
  trend: string;
  momentum: string;
}

function TimeframeTable({ timeframes, data }: { timeframes: string[]; data: Record<string, TimeframeDisplayData> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="pb-2 px-2">Timeframe</th>
            <th className="pb-2 px-2">Bullish %</th>
            <th className="pb-2 px-2">Confidence</th>
            <th className="pb-2 px-2">Exp. Return</th>
            <th className="pb-2 px-2">Trend</th>
            <th className="pb-2 px-2">Momentum</th>
          </tr>
        </thead>
        <tbody>
          {timeframes.map((tf) => {
            const d = data[tf];
            return (
              <tr key={tf} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2 font-mono font-medium">{d.timeframe}</td>
                <td className="py-2 px-2">{d.bullishPercent}</td>
                <td className="py-2 px-2">{d.confidence}</td>
                <td className="py-2 px-2">{d.expectedReturn}</td>
                <td className="py-2 px-2">
                  <Badge variant={d.trend === "up" ? "default" : d.trend === "down" ? "destructive" : "outline"} className="text-xs">
                    {d.trend}
                  </Badge>
                </td>
                <td className="py-2 px-2">
                  <Badge variant={d.momentum === "bullish" ? "default" : d.momentum === "bearish" ? "destructive" : "outline"} className="text-xs">
                    {d.momentum}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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