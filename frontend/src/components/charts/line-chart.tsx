"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

export function LineChart({
  data,
  height = 300,
  color = "#2563EB",
  showGrid = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
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
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
