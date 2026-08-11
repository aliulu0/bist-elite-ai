"use client";

import { BarChart } from "./bar-chart";

interface RankingDistributionChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function RankingDistributionChart({
  data,
  height = 250,
}: RankingDistributionChartProps) {
  return <BarChart data={data} height={height} color="#8B5CF6" />;
}
