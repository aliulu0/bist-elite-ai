import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, LoadingCard, SectionTitle, EmptyState } from '@/components/shared';
import { GitBranch, Clock, CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { sdkClient } from '@/lib/sdk';
import type { AnalysisResult } from './analysis-types';

interface TabWorkflowProps {
  data: AnalysisResult;
}

interface WorkflowItem {
  id: string;
  type: string;
  status: string;
  symbol: string;
  steps: Array<{ step: string; status: string; startedAt?: string; completedAt?: string; durationMs?: number; error?: string | null }>;
  currentStep: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: string; label: string }> = {
    completed: { variant: 'success', label: 'Tamamlandı' },
    running: { variant: 'info', label: 'Çalışıyor' },
    pending: { variant: 'outline', label: 'Bekliyor' },
    queued: { variant: 'outline', label: 'Kuyrukta' },
    failed: { variant: 'danger', label: 'Başarısız' },
    timeout: { variant: 'warning', label: 'Zaman Aşımı' },
    cancelled: { variant: 'danger', label: 'İptal' },
  };
  const { variant, label } = map[status] || { variant: 'outline', label: status };
  return <Badge variant={variant as 'success' | 'info' | 'outline' | 'danger' | 'warning'}>{label}</Badge>;
}

export function TabWorkflow({ data }: TabWorkflowProps) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.workflows();
      const items = (res.data || []).filter((w) => w.symbol === data.symbol);
      setWorkflows(items);
    } catch {
      setError('İş akışları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [data.symbol]);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  return (
    <div className="space-y-4">
      <SectionTitle title="İş Akışları" description="Bu hisseye ait iş akışı geçmişi" />

      <Card title="İş Akışı Durumu">
        {loading ? (
          <LoadingCard />
        ) : error ? (
          <p className="py-4 text-center text-xs text-destructive">{error}</p>
        ) : workflows.length === 0 ? (
          <EmptyState title="İş akışı bulunamadı" description="Bu hisse için henüz iş akışı çalışmamış" />
        ) : (
          <div className="space-y-3">
            {workflows.slice(0, 5).map((wf) => (
              <div key={wf.id} className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">{wf.type}</span>
                  </div>
                  <StatusBadge status={wf.status} />
                </div>

                {wf.steps && wf.steps.length > 0 && (
                  <div className="space-y-1">
                    {wf.steps.map((step, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-2.5 w-2.5 text-success" />
                          ) : step.status === 'failed' ? (
                            <XCircle className="h-2.5 w-2.5 text-destructive" />
                          ) : step.status === 'running' ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin text-info" />
                          ) : (
                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">{step.step}</span>
                        </div>
                        {step.durationMs && (
                          <span className="tabular-nums text-muted-foreground">{step.durationMs}ms</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>İlerleme: {wf.progress}%</span>
                  {wf.durationMs && <span>Süre: {(wf.durationMs / 1000).toFixed(1)}s</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
