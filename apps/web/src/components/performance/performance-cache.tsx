import { Card, Progress, EmptyState } from '@/components/shared';
import type { PerformanceSnapshot } from './performance-types';
import { Database, AlertTriangle } from 'lucide-react';

interface PerformanceCacheProps {
  snapshot: PerformanceSnapshot | null;
}

export function PerformanceCache({ snapshot }: PerformanceCacheProps) {
  if (!snapshot) {
    return <EmptyState title="Önbellek verisi yok" description="Önbellek verileri toplandığında burada görüntülenecek" />;
  }

  const cache = snapshot.cacheMetrics;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Hit Oranı</span>
            <p className="text-lg font-bold">{cache.hitRate.toFixed(1)}%</p>
            <Progress value={cache.hitRate} size="sm" variant={cache.hitRate > 80 ? 'success' : cache.hitRate > 50 ? 'warning' : 'danger'} />
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Miss Oranı</span>
            <p className="text-lg font-bold">{cache.missRate.toFixed(1)}%</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Eviction Sayısı</span>
            <p className="text-lg font-bold">{cache.evictions}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Önbellek Boyutu</span>
            <p className="text-lg font-bold">{formatBytes(cache.sizeBytes)}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Girdi Sayısı</span>
            <p className="text-lg font-bold">{cache.entryCount}</p>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Durum</span>
              <p className="text-sm font-medium text-success">Aktif</p>
            </div>
          </div>
        </Card>
      </div>
      {cache.warnings.length > 0 && (
        <Card title="Cache Uyarıları">
          <div className="space-y-2">
            {cache.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-warning/5 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span className="text-xs">{warning}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
