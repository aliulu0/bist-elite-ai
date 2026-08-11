"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerformanceChartProps {
  data: { date: string; value: number; benchmark?: number }[];
  height?: number;
  showBenchmark?: boolean;
}

export function PerformanceChart({
  data,
  height = 300,
  showBenchmark = true,
}: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
          {showBenchmark && (
            <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A1A1AA" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#A1A1AA" stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
        <XAxis
          dataKey="date"
          stroke="#A1A1AA"
          fontSize={12}
          tickLine={false}
        />
        <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181B",
            border: "1px solid #27272A",
            borderRadius: "8px",
            color: "#FAFAFA",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#2563EB"
          strokeWidth={2}
          fill="url(#colorValue)"
        />
        {showBenchmark && (
          <Area
            type="monotone"
            dataKey="benchmark"
            stroke="#A1A1AA"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#colorBenchmark)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
