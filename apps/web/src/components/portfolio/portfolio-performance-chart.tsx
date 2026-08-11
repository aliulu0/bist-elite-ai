import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EmptyState } from '@/components/shared';
import { TrendingUp } from 'lucide-react';

interface PortfolioPerformanceChartProps {
  data: Array<{ date: string; value: number }>;
}

export function PortfolioPerformanceChart({ data }: PortfolioPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Portföy Değeri</h3>
        <EmptyState
          title="Henüz portföy verisi bulunmuyor"
          description="İşlem ekledikten sonra performans grafiği burada görünecek"
          icon={<TrendingUp className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Portföy Değeri</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <YAxis
              stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Değer']}
              labelFormatter={(label) => `Tarih: ${label}`}
            />
            <Legend />
            <Line
              type="monotone" dataKey="value" stroke="hsl(var(--primary))"
              strokeWidth={2} dot={false} name="Portföy Değeri"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
