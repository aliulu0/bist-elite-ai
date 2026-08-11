import { Card, EmptyState } from '@/components/shared';
import type { WorkflowSnapshot } from './workflow-types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WorkflowStatisticsProps {
  snapshot: WorkflowSnapshot | null;
}

const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export function WorkflowStatistics({ snapshot }: WorkflowStatisticsProps) {
  if (!snapshot || snapshot.statistics.totalCreated === 0) {
    return <EmptyState title="İstatistik verisi bulunmuyor" description="Henüz yeterli veri yok" />;
  }

  const { statistics } = snapshot;

  const typeData = Object.entries(statistics.byType).map(([type, data]) => ({
    name: type,
    Tamamlanan: data.completed,
    Başarısız: data.failed,
    Toplam: data.created,
  }));

  const statusData = [
    { name: 'Tamamlandı', value: statistics.totalCompleted },
    { name: 'Başarısız', value: statistics.totalFailed },
    { name: 'İptal', value: statistics.totalCancelled },
  ].filter((d) => d.value > 0);

  const completionRate = statistics.totalCreated > 0
    ? Math.round((statistics.totalCompleted / statistics.totalCreated) * 100)
    : 0;

  const avgDuration = statistics.avgDurationMs < 1000
    ? `${statistics.avgDurationMs}ms`
    : statistics.avgDurationMs < 60000
    ? `${(statistics.avgDurationMs / 1000).toFixed(1)}s`
    : `${Math.round(statistics.avgDurationMs / 60000)}dk`;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-3 text-sm font-semibold">Genel İstatistikler</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{statistics.totalCreated}</p>
            <p className="text-xs text-muted-foreground">Toplam</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">%{completionRate}</p>
            <p className="text-xs text-muted-foreground">Başarı Oranı</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{avgDuration}</p>
            <p className="text-xs text-muted-foreground">Ortalama Süre</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{statistics.activeWorkflows}</p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </div>
        </div>
      </Card>

      {statusData.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Durum Dağılımı</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {typeData.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Türe Göre Dağılım</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tamamlanan" fill="#22c55e" />
                <Bar dataKey="Başarısız" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
