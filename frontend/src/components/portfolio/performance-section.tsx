"use client";

import { useState } from "react";
import { usePortfolioPerformance } from "@/hooks";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export function PerformanceSection() {
  const [period, setPeriod] = useState("1M");
  const { data, isLoading } = usePortfolioPerformance(period);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance</CardTitle>
          <Select
            label=""
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: "1W", label: "1 Week" },
              { value: "1M", label: "1 Month" },
              { value: "3M", label: "3 Months" },
              { value: "6M", label: "6 Months" },
              { value: "1Y", label: "1 Year" },
              { value: "ALL", label: "All Time" },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] animate-pulse rounded-xl bg-border/50" />
        ) : (
          <PerformanceChart
            data={data || []}
            height={300}
            showBenchmark
          />
        )}
      </CardContent>
    </Card>
  );
}
