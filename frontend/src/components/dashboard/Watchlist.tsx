"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useWatchlistData } from "@/hooks/use-dashboard";
import { useEarlyOpportunity } from "@/hooks/use-dashboard";
import type { WatchlistData, EarlyOpportunityIntelligenceResult } from "@/types/dashboard";

export function Watchlist() {
  const { data, isLoading, error } = useWatchlistData();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          Failed to load watchlist
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Watchlist</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="favorites">Favorites ({data.favorites.length})</TabsTrigger>
            <TabsTrigger value="pinned">Pinned ({data.pinned.length})</TabsTrigger>
            <TabsTrigger value="recent">Recent ({data.recent.length})</TabsTrigger>
            <TabsTrigger value="alerts">AI Alerts ({data.aiAlerts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-4">
            <WatchlistTab tickers={data.favorites} title="Favorite Stocks" />
          </TabsContent>

          <TabsContent value="pinned" className="mt-4">
            <WatchlistTab tickers={data.pinned} title="Pinned Stocks" />
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <WatchlistTab tickers={data.recent} title="Recent Analysis" />
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <AlertsTab alerts={data.aiAlerts} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function WatchlistTab({ tickers, title }: { tickers: string[]; title: string }) {
  if (tickers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {title.toLowerCase()} yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickers.map((ticker) => (
        <WatchlistItem key={ticker} ticker={ticker} />
      ))}
    </div>
  );
}

function WatchlistItem({ ticker }: { ticker: string }) {
  const { data, isLoading } = useEarlyOpportunity(ticker);

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-2 animate-pulse">
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-between p-2 text-muted-foreground text-sm">
        <span className="font-medium">{ticker}</span>
        <span>No data</span>
      </div>
    );
  }

  const levelMeta = data.earlyOpportunityLevel 
    ? {
        ÇOK_GÜÇLÜ_FIRSAT: { emoji: "🔥", label: "Very Strong" },
        GÜÇLÜ_FIRSAT: { emoji: "🟢", label: "Strong" },
        FIRSAT: { emoji: "🟢", label: "Opportunity" },
        İZLEME_LISTESI: { emoji: "🟡", label: "Watch" },
        BEKLE: { emoji: "⚪", label: "Wait" },
      }[data.earlyOpportunityLevel]
    : { emoji: "⚪", label: "Unknown" };

  return (
    <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors">
      <div className="flex items-center gap-3">
        <span className="font-mono font-medium text-sm">{data.ticker}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{data.company}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {levelMeta.emoji} {data.earlyOpportunityScore}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {data.expectedReturn.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function AlertsTab({ alerts }: { alerts: Array<{ ticker: string; message: string; priority: string }> }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No AI alerts
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div key={i} className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono font-medium">{alert.ticker}</span>
                <Badge variant="outline" className="text-xs">
                  {alert.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}