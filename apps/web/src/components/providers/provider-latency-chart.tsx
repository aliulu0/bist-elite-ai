import { Card, EmptyState } from '@/components/shared';
import type { ProviderHealthSnapshot } from './provider-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ProviderLatencyChartProps {
  snapshot: ProviderHealthSnapshot | null;
  selectedProvider?: string | null;
}

export function ProviderLatencyChart({ snapshot, selectedProvider }: ProviderLatencyChartProps) {
  if (!snapshot) {
    return <EmptyState title="Gecikme grafiği verisi yok" description="Veri toplandığında burada görüntülenecek" />;
  }

  const providerNames = selectedProvider ? [selectedProvider] : Object.keys(snapshot.latencyHistory);

  if (providerNames.length === 0) {
    return <EmptyState title="Gecikme geçmişi bulunmuyor" description="Seçili sağlayıcı için veri yok" />;
  }

  const allTimestamps = new Set<string>();
  for (const name of providerNames) {
    const history = snapshot.latencyHistory[name] || [];
    for (const point of history) {
      allTimestamps.add(point.timestamp);
    }
  }

  const sortedTimestamps = [...allTimestamps].sort();
  const data = sortedTimestamps.map((ts) => {
    const entry: Record<string, string | number> = {
      time: new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    for (const name of providerNames) {
      const history = snapshot.latencyHistory[name] || [];
      const point = history.find((h) => h.timestamp === ts);
      entry[name] = point ? point.latencyMs : 0;
    }
    return entry;
  });

  const colors = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <Card title="Gecikme Trendi">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            {providerNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
