import { Card, LoadingCard, Badge, Progress } from '@/components/shared';
import { Stethoscope, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DiagnosticCheck {
  name: string;
  status: string;
  message: string;
  duration: number;
}

interface SystemHealthCardProps {
  checks: DiagnosticCheck[];
  loading?: boolean;
  error?: string;
}

function getStatusIcon(status: string) {
  if (status === 'pass') return <CheckCircle2 className="h-3 w-3 text-success" />;
  if (status === 'warning') return <AlertTriangle className="h-3 w-3 text-warning" />;
  return <XCircle className="h-3 w-3 text-destructive" />;
}

function getStatusBadge(status: string) {
  if (status === 'pass') return { variant: 'success' as const, label: 'Geçti' };
  if (status === 'warning') return { variant: 'warning' as const, label: 'Uyarı' };
  return { variant: 'danger' as const, label: 'Başarısız' };
}

export function SystemHealthCard({ checks, loading, error }: SystemHealthCardProps) {
  const passed = checks.filter((c) => c.status === 'pass').length;
  const warnings = checks.filter((c) => c.status === 'warning').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const healthPct = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0;

  return (
    <Card
      title="Sistem Durumu"
      description={checks.length > 0 ? `${healthPct}% sağlıklı` : undefined}
      action={<Stethoscope className="h-4 w-4 text-muted-foreground" />}
    >
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : checks.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Kontrol sonucu yok</p>
      ) : (
        <>
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Sistem Sağlığı</span>
              <span className="font-semibold tabular-nums">{healthPct}%</span>
            </div>
            <Progress
              value={healthPct}
              variant={healthPct >= 90 ? 'success' : healthPct >= 70 ? 'warning' : 'danger'}
              size="sm"
            />
          </div>
          <div className="mb-3 flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success" />{passed} geçti</span>
            {warnings > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-warning" />{warnings} uyarı</span>}
            {failed > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive" />{failed} başarısız</span>}
          </div>
          <div className="space-y-1">
            {checks.map((c, i) => {
              const badge = getStatusBadge(c.status);
              return (
                <div key={i} className="flex items-center justify-between rounded bg-muted/30 px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(c.status)}
                    <span className="text-xs font-medium">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{c.message}</span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">{c.duration}ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
