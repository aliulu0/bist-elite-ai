import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Clock, Database, GitBranch, Loader2, Play, Server } from 'lucide-react';
import { sdkClient } from '@/lib/sdk';
import { cn } from '@/lib/utils';

type PipelineRun = {
  id: string;
  currentStep: string;
  completedSteps: number;
  executionTime: number;
  providerUsed: string;
  schedulerJob: string;
  status: string;
  createdAt: string;
};

type SchedulerJob = {
  jobName: string;
  status: string;
  lastExecution: { durationMs: number; startedAt: string; completedAt: string | null; success: boolean } | null;
};

type ProviderHealth = {
  provider: string;
  status: string;
  avgLatencyMs: number;
};

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('running') || normalized.includes('healthy') || normalized.includes('completed')) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  if (normalized.includes('pending') || normalized.includes('queued') || normalized.includes('degraded')) return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  if (normalized.includes('failed') || normalized.includes('unhealthy')) return 'border-red-500/40 bg-red-500/10 text-red-300';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

function toPipelineRun(workflow: Record<string, unknown>, provider: ProviderHealth | undefined, scheduler: SchedulerJob | undefined): PipelineRun {
  const steps = Array.isArray(workflow.steps) ? workflow.steps as Array<Record<string, unknown>> : [];
  const completedSteps = steps.filter((step) => String(step.status).toLowerCase() === 'completed').length;
  return {
    id: String(workflow.id ?? ''),
    currentStep: String(workflow.currentStep ?? workflow.status ?? 'Idle'),
    completedSteps,
    executionTime: Number(workflow.durationMs ?? scheduler?.lastExecution?.durationMs ?? 0),
    providerUsed: provider?.provider ?? 'No provider selected',
    schedulerJob: scheduler?.jobName ?? 'No scheduler job',
    status: String(workflow.status ?? 'UNKNOWN'),
    createdAt: String(workflow.createdAt ?? ''),
  };
}

export default function PipelineStatusPage() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState<Record<string, unknown> | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [schedulerJobs, setSchedulerJobs] = useState<SchedulerJob[]>([]);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pipelineRes, workflowsRes, historyRes, schedulerRes, providerRes] = await Promise.allSettled([
        sdkClient.pipelineStatus(),
        sdkClient.workflows(),
        sdkClient.workflowsHistory(),
        sdkClient.schedulerStatus(),
        sdkClient.providerHealth(),
      ]);

      const pipeline = pipelineRes.status === 'fulfilled' ? pipelineRes.value as Record<string, unknown> : null;
      const workflowData = workflowsRes.status === 'fulfilled' ? workflowsRes.value as { data?: Array<Record<string, unknown>> } : { data: [] };
      const historyData = historyRes.status === 'fulfilled' ? historyRes.value as { data?: Array<Record<string, unknown>> } : { data: [] };
      const schedulerData = schedulerRes.status === 'fulfilled' ? schedulerRes.value as { jobs?: SchedulerJob[] } : { jobs: [] };
      const providerData = providerRes.status === 'fulfilled' ? providerRes.value as { data?: { providers?: ProviderHealth[] } } : { data: { providers: [] } };

      const providerList = providerData.data?.providers ?? [];
      const schedulerList = schedulerData.jobs ?? [];
      const activeProvider = providerList.find((provider) => provider.status === 'healthy') ?? providerList[0];
      const activeScheduler = schedulerList.find((job) => job.status === 'running') ?? schedulerList[0];
      const workflowRows = [...(workflowData.data ?? []), ...(historyData.data ?? [])];

      setPipelineStatus(pipeline);
      setSchedulerJobs(schedulerList);
      setProviders(providerList);
      setRuns(workflowRows.map((workflow) => toPipelineRun(workflow, activeProvider, activeScheduler)));
    } catch {
      setError('Pipeline status could not be loaded from the existing APIs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const current = useMemo(() => runs.find((run) => run.status === 'RUNNING') ?? runs[0], [runs]);
  const metrics = pipelineStatus?.metrics as Record<string, unknown> | undefined;
  const stepDurations = pipelineStatus?.stepDurations as Record<string, number> | undefined;

  const triggerPipeline = async () => {
    setRunning(true);
    setError('');
    try {
      await sdkClient.pipelineRun();
      await fetchData();
    } catch {
      setError('İş hattı çalıştırma isteği başarısız oldu.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">İş Hattı Monitörü</div>
          <h1 className="text-2xl font-semibold">İş Hattı Durumu</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors hover:bg-accent"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            Yenile
          </button>
          <button
            type="button"
            onClick={triggerPipeline}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            İş Hattını Çalıştır
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {[
          { label: 'Mevcut Adım', value: current?.currentStep ?? 'Boşta', icon: GitBranch },
          { label: 'Tamamlanan Adımlar', value: current?.completedSteps ?? 0, icon: Activity },
          { label: 'Çalışma Süresi', value: `${current?.executionTime ?? 0} ms`, icon: Clock },
          { label: 'Kullanılan Sağlayıcı', value: current?.providerUsed ?? providers[0]?.provider ?? 'Veri yok', icon: Server },
          { label: 'Zamanlayıcı Görevi', value: current?.schedulerJob ?? schedulerJobs[0]?.jobName ?? 'Görev yok', icon: Database },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</span>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 truncate font-mono text-lg font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">İş Hattı Geçmişi</h2>
            <span className="text-xs text-muted-foreground">{runs.length} çalıştırma</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {['İş Akışı', 'Mevcut Adım', 'Tamamlanan Adımlar', 'Çalışma Süresi', 'Kullanılan Sağlayıcı', 'Zamanlayıcı Görevi', 'Durum', 'Oluşturulma'].map((column) => (
                    <th key={column} className="px-3 py-2 font-medium">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={`${run.id}-${run.createdAt}`} className="border-b transition-colors hover:bg-muted/40">
                    <td className="px-3 py-3 font-mono text-xs">{run.id || '-'}</td>
                    <td className="px-3 py-3">{run.currentStep}</td>
                    <td className="px-3 py-3 font-mono">{run.completedSteps}</td>
                    <td className="px-3 py-3 font-mono">{run.executionTime} ms</td>
                    <td className="px-3 py-3">{run.providerUsed}</td>
                    <td className="px-3 py-3">{run.schedulerJob}</td>
                    <td className="px-3 py-3"><span className={cn('rounded border px-2 py-0.5 text-xs', statusClass(run.status))}>{run.status}</span></td>
                    <td className="px-3 py-3 font-mono text-xs">{run.createdAt ? new Date(run.createdAt).toLocaleString('tr-TR') : '-'}</td>
                  </tr>
                ))}
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">Mevcut arka uç iş hattı geçmişi döndürmedi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Adım Süreleri</h2>
            <div className="space-y-2">
              {Object.entries(stepDurations ?? {}).map(([step, duration]) => (
                <div key={step} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <span>{step}</span>
                  <span className="font-mono">{duration} ms</span>
                </div>
              ))}
              {Object.keys(stepDurations ?? {}).length === 0 && <div className="text-sm text-muted-foreground">Adım süresi metriği döndürülmedi.</div>}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">İş Hattı Metrikleri</h2>
            <div className="space-y-2">
              {Object.entries(metrics ?? {}).slice(0, 8).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <span>{key}</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
              {Object.keys(metrics ?? {}).length === 0 && <div className="text-sm text-muted-foreground">İş hattı metriği döndürülmedi.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
