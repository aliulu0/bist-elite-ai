import { Card, LoadingCard } from '@/components/shared';
import { Gauge } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface PerformanceMetric {
  name: string;
  category: string;
  avg: number;
  rollingAvg: number;
}

export interface PerformanceMetrics {
  metrics: PerformanceMetric[];
  system: { uptimeMs: number; memoryUsageBytes: number; cpuUsagePercent: number };
}

interface PerformanceCardProps {
  data: PerformanceMetrics | null;
  loading?: boolean;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatUptime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}s ${minutes % 60}dk`;
  const days = Math.floor(hours / 24);
  return `${days}g ${hours % 24}s`;
}

export function PerformanceCard({ data, loading, error }: PerformanceCardProps) {
  const trend = (data?.metrics || []).map((m) => ({
    t: m.name,
    v: m.rollingAvg || m.avg || 0,
  }));

  return (
    <Card
      title="Performans"
      description="Sistem metrikleri"
      action={<Gauge className="h-4 w-4 text-muted-foreground" />}
    >
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : !data ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Veri yok</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Çalışma Süresi</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums">{formatUptime(data.system.uptimeMs)}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bellek</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums">{formatBytes(data.system.memoryUsageBytes)}</p>
            </div>
          </div>
          <div className="h-[100px]">
            {trend.length === 0 ? (
              <p className="flex h-full items-center justify-center text-xs text-muted-foreground">Metrik verisi yok</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="t" tick={{ fontSize: 9 }} interval={2} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 6, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                    formatter={(value: number) => [value.toFixed(1), 'Ortalama']}
                  />
                  <Bar dataKey="v" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
