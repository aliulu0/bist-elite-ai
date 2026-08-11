"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

export function BarChart({
  data,
  height = 300,
  color = "#2563EB",
  showGrid = true,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
        )}
        <XAxis
          dataKey="label"
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
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
