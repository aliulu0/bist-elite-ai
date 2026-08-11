import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { BacktestResult } from './backtest-types';

interface BacktestEquityChartProps {
  result: BacktestResult;
}

export function BacktestEquityChart({ result }: BacktestEquityChartProps) {
  const data = result.equityCurve.map((value, index) => ({
    index,
    value,
  }));

  const min = Math.min(...result.equityCurve);
  const max = Math.max(...result.equityCurve);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Özkaynak Eğrisi</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="index"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              domain={[min * 0.98, max * 1.02]}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Özkaynak']}
              labelFormatter={(label) => `Periyot: ${label}`}
            />
            <Legend />
            <ReferenceLine y={result.equityCurve[0]} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label="Başlangıç" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Özkaynak"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
