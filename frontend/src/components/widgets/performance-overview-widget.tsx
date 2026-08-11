"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { useDashboard } from "@/hooks";

export function PerformanceOverviewWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded-xl bg-border/50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <PerformanceChart data={data.performance} height={300} />
      </CardContent>
    </Card>
  );
}
