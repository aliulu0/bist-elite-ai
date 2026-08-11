import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EmptyState } from '@/components/shared';
import { PieChart as PieIcon } from 'lucide-react';
import type { AllocationItem } from './portfolio-types';

interface PortfolioSectorChartProps {
  data: AllocationItem[];
}

export function PortfolioSectorChart({ data }: PortfolioSectorChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Sektör Dağılımı</h3>
        <EmptyState
          title="Sektör verisi yok"
          description="Hisse eklendikten sonra sektör dağılımı burada görünecek"
          icon={<PieIcon className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Sektör Dağılımı</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} dataKey="percent" nameKey="name"
              cx="50%" cy="50%" innerRadius={50} outerRadius={80}
              paddingAngle={2} strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            />
            <Legend
              formatter={(value: string) => value}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
