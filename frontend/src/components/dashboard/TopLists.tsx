"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTopLists } from "@/hooks/use-dashboard";
import type { TopListsData, TopListItem } from "@/types/dashboard";

const LIST_CONFIG = [
  { key: "smartMoney", label: "Smart Money", icon: "💰" },
  { key: "catalyst", label: "Catalyst", icon: "⚡" },
  { key: "confidence", label: "Confidence", icon: "🎯" },
  { key: "expectedReturn", label: "Exp. Return", icon: "📈" },
  { key: "eliteScore", label: "Elite Score", icon: "🏆" },
  { key: "opportunity", label: "Opportunity", icon: "🔥" },
  { key: "riskReward", label: "Risk/Reward", icon: "⚖️" },
] as const;

export function TopLists() {
  const { data, isLoading, error } = useTopLists();

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
          Failed to load top lists
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Lists</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="smartMoney" className="w-full">
          <TabsList className="grid w-full grid-cols-7 text-xs">
            {LIST_CONFIG.map((item) => (
              <TabsTrigger key={item.key} value={item.key}>
                {item.icon} {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {LIST_CONFIG.map((item) => (
            <TabsContent key={item.key} value={item.key} className="mt-4">
              <TopListTable items={data[item.key as keyof TopListsData] as TopListItem[]} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TopListTable({ items }: { items: TopListItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="pb-2 px-2">#</th>
            <th className="pb-2 px-2">Ticker</th>
            <th className="pb-2 px-2">Name</th>
            <th className="pb-2 px-2">Sector</th>
            <th className="pb-2 px-2">Value</th>
            <th className="pb-2 px-2">Change</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 20).map((item, i) => (
            <tr key={item.ticker} className="border-b hover:bg-muted/50">
              <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
              <td className="py-2 px-2 font-mono font-medium">{item.ticker}</td>
              <td className="py-2 px-2 truncate max-w-[120px]">{item.name}</td>
              <td className="py-2 px-2 text-muted-foreground">{item.sector}</td>
              <td className="py-2 px-2 font-medium">{formatValue(item.value)}</td>
              <td className="py-2 px-2">
                {item.changePercent !== undefined && (
                  <Badge variant={item.changePercent >= 0 ? "default" : "destructive"} className="text-xs">
                    {item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(2) + "K";
  return value.toFixed(2);
}