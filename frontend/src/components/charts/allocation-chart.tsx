"use client";

import { PieChart } from "./pie-chart";

interface AllocationChartProps {
  data: { name: string; value: number; percentage: number }[];
  height?: number;
}

export function AllocationChart({ data, height = 250 }: AllocationChartProps) {
  return (
    <div className="space-y-3">
      <PieChart
        data={data.map((d) => ({ name: d.name, value: d.value }))}
        height={height}
      />
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <span className="text-muted">{item.name}</span>
            <span className="font-medium text-text">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
