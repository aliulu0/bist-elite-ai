"use client";

import { usePortfolioAllocation } from "@/hooks";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AllocationSection() {
  const { data, isLoading } = usePortfolioAllocation();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded-xl bg-border/50" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <p>No allocation data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sector Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <AllocationChart data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
