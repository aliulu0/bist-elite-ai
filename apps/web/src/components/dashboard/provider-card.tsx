import { Card, Badge, LoadingCard, Progress } from '@/components/shared';
import { Server, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Provider {
  name: string;
  status: string;
  reliability: number;
  lastCheck: string;
}

interface ProviderCardProps {
  providers: Provider[];
  loading?: boolean;
  error?: string;
}

function getStatusIcon(status: string) {
  if (status === 'healthy') return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  if (status === 'degraded') return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
  return <XCircle className="h-3.5 w-3.5 text-destructive" />;
}

function getStatusLabel(status: string) {
  if (status === 'healthy') return { label: 'Sağlıklı', variant: 'success' as const };
  if (status === 'degraded') return { label: 'Düşük', variant: 'warning' as const };
  return { label: 'Hatalı', variant: 'danger' as const };
}

export function ProviderCard({ providers, loading, error }: ProviderCardProps) {
  const healthy = providers.filter((p) => p.status === 'healthy').length;

  return (
    <Card
      title="Veri Sağlayıcıları"
      description={providers.length > 0 ? `${healthy}/${providers.length} sağlıklı` : undefined}
      action={<Server className="h-4 w-4 text-muted-foreground" />}
    >
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : providers.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Sağlayıcı bulunamadı</p>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => {
            const st = getStatusLabel(p.status);
            return (
              <div key={p.name} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  {getStatusIcon(p.status)}
                  <div>
                    <span className="text-sm font-medium">{p.name}</span>
                    <p className="text-[10px] text-muted-foreground">
                      Son kontrol: {p.lastCheck ? new Date(p.lastCheck).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={p.reliability} variant={p.reliability >= 90 ? 'success' : p.reliability >= 70 ? 'warning' : 'danger'} size="sm" className="w-16" />
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
