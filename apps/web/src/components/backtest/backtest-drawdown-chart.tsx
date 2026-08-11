import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BacktestResult } from './backtest-types';

interface BacktestDrawdownChartProps {
  result: BacktestResult;
}

export function BacktestDrawdownChart({ result }: BacktestDrawdownChartProps) {
  const equity = result.equityCurve;
  const drawdowns: number[] = [];
  let peak = equity[0] || 0;

  for (const value of equity) {
    if (value > peak) peak = value;
    drawdowns.push(peak > 0 ? ((value - peak) / peak) * 100 : 0);
  }

  const data = drawdowns.map((value, index) => ({
    index,
    drawdown: value,
  }));

  const min = Math.min(...drawdowns);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Drawdown Grafiği</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
              domain={[min * 1.1, 1]}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
              labelFormatter={(label) => `Periyot: ${label}`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="hsl(var(--destructive))"
              fill="hsl(var(--destructive))"
              fillOpacity={0.15}
              strokeWidth={1.5}
              name="Drawdown"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
