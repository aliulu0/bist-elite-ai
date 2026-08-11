"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PieChartProps {
  data: { name: string; value: number }[];
  height?: number;
  colors?: string[];
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  "#2563EB", "#22C55E", "#EF4444", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

export function PieChart({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181B",
            border: "1px solid #27272A",
            borderRadius: "8px",
            color: "#FAFAFA",
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#A1A1AA" }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
