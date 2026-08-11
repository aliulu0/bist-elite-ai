"use client";

import { PieChart } from "./pie-chart";

interface SectorDistributionChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function SectorDistributionChart({
  data,
  height = 300,
}: SectorDistributionChartProps) {
  return <PieChart data={data} height={height} showLegend />;
}
