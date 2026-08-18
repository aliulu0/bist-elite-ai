import { useCallback, useState } from 'react';
import {
  PageHeader,
  LoadingCard,
  ErrorCard,
  EmptyState,
  Card,
  StatCard,
  DataTable,
  SectionTitle,
  Badge,
} from '@/components/shared';
import { sdkClient } from '@/lib/sdk';
import { FlaskConical, Play, Loader2, FileText, Target, ShieldAlert } from 'lucide-react';

interface BacktestSummary {
  runId: string;
  decisionsEvaluated: number;
  winRate: number;
  averageReturn: number;
  medianReturn: number;
  benchmarkExcessReturn: number | null;
  maxDrawdown: number;
  averageLeadTime: number | null;
  falsePositiveCount: number;
  missedOpportunityCount: number;
  sampleQuality: string;
  survivorshipWarning: string;
  pointInTimeVerified: boolean;
}

interface BacktestRunResponse {
  runId: string;
  completedAt: string;
  decisionsEvaluated: number;
  outcomesEvaluated: number;
  executionDurationMs: number;
  providerCalls: number;
  cacheHits: number;
  summary: BacktestSummary;
  decisionTable: Array<{
    ticker: string;
    decisionDate: string;
    decision: string;
    eliteScore: number;
    confidence: number;
    expectedReturn: number;
    realizedReturn: number | null;
    return1W: number | null;
    return1M: number | null;
    return3M: number | null;
    return6M: number | null;
    return1Y: number | null;
    benchmarkReturn: number | null;
    excessReturn: number | null;
    maxDrawdown: number;
    leadTime: number | null;
    outcome: string;
    dataQuality: string;
  }>;
}

interface RunForm {
  symbols: string;
  startDate: string;
  endDate: string;
  minScore: string;
  benchmark: string;
  commission: string;
  slippage: string;
  maxSymbols: string;
  maxDecisions: string;
}

const DEFAULT_FORM: RunForm = {
  symbols: '',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  minScore: '',
  benchmark: '',
  commission: '',
  slippage: '',
  maxSymbols: '10',
  maxDecisions: '100',
};

function formatNumber(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return `${value.toFixed(2)}${suffix}`;
}

function qualityVariant(
  q: string | undefined,
): 'success' | 'warning' | 'danger' | 'outline' | 'default' {
  if (q === 'GOOD' || q === 'SUFFICIENT') return 'success';
  if (q === 'INSUFFICIENT_SAMPLE' || q === 'MODERATE') return 'warning';
  if (q?.includes('INSUFFICIENT')) return 'warning';
  return 'outline';
}

export default function BacktestPage() {
  const [form, setForm] = useState<RunForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BacktestRunResponse | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [failures, setFailures] = useState<unknown>(null);
  const [missed, setMissed] = useState<unknown>(null);
  const [calibration, setCalibration] = useState<unknown>(null);
  const [leadTime, setLeadTime] = useState<unknown>(null);
  const [loadError, setLoadError] = useState('');

  const runBacktest = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setRunId(null);
    setFailures(null);
    setMissed(null);
    setCalibration(null);
    setLeadTime(null);
    try {
      const body: Record<string, unknown> = {
        startDate: form.startDate,
        endDate: form.endDate,
        maxSymbols: Number(form.maxSymbols) || 10,
        maxDecisions: Number(form.maxDecisions) || 100,
      };
      if (form.symbols.trim())
        body.symbols = form.symbols
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
      if (form.minScore) body.minScore = Number(form.minScore);
      if (form.benchmark.trim()) body.benchmark = form.benchmark.trim().toUpperCase();
      if (form.commission) body.commission = Number(form.commission);
      if (form.slippage) body.slippage = Number(form.slippage);

      const run = (await sdkClient.backtestEO.run(body)) as unknown as { runId: string };
      setRunId(run.runId);
      await loadRun(run.runId);
    } catch {
      setError('Backtest çalıştırılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [form]);

  const loadRun = useCallback(async (id: string) => {
    try {
      const detail = (await sdkClient.backtestEO.getRun(id)) as unknown as BacktestRunResponse;
      setResult(detail);
    } catch {
      setLoadError('Backtest sonucu alınamadı');
    }
  }, []);

  const loadDetails = useCallback(async (id: string) => {
    try {
      const [f, m, c, l] = await Promise.all([
        sdkClient.backtestEO.failures(id),
        sdkClient.backtestEO.missedOpportunities(id),
        sdkClient.backtestEO.calibration(id),
        sdkClient.backtestEO.leadTime(id),
      ]);
      setFailures(f);
      setMissed(m);
      setCalibration(c);
      setLeadTime(l);
    } catch {
      // Individual detail reports may not exist for all runs
    }
  }, []);

  const handleRefresh = () => {
    if (runId) {
      loadRun(runId);
      loadDetails(runId);
    }
  };

  const inputClass =
    'w-full rounded-md border bg-card px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground';

  return (
    <div>
      <PageHeader
        title="Erken Fırsat Backtesti"
        description="Geçmiş erken fırsat kararlarını gerçek verilerle test edin (backtestEO)"
        actions={
          result && (
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <FlaskConical className="h-4 w-4" /> Yenile
            </button>
          )
        }
      />

      <div className="space-y-4">
        <Card
          title="Backtest Ayarları"
          description="Çalıştırma parametreleri — sembol listesi, tarih aralığı, filtreler"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">
                Semboller (virgülle, boş = tümü)
              </span>
              <input
                value={form.symbols}
                onChange={(e) => setForm({ ...form, symbols: e.target.value })}
                placeholder="THYAO, AKBNK"
                className={inputClass}
                aria-label="Semboller"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Başlangıç</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={inputClass}
                aria-label="Başlangıç tarihi"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Bitiş</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={inputClass}
                aria-label="Bitiş tarihi"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Min. Karar Skoru</span>
              <input
                type="number"
                value={form.minScore}
                onChange={(e) => setForm({ ...form, minScore: e.target.value })}
                placeholder="0"
                className={inputClass}
                aria-label="Minimum karar skoru"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Benchmark</span>
              <input
                value={form.benchmark}
                onChange={(e) => setForm({ ...form, benchmark: e.target.value })}
                placeholder="XU030.IS"
                className={inputClass}
                aria-label="Benchmark"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Komisyon (%)</span>
              <input
                type="number"
                step="0.1"
                value={form.commission}
                onChange={(e) => setForm({ ...form, commission: e.target.value })}
                className={inputClass}
                aria-label="Komisyon"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Kayma (%)</span>
              <input
                type="number"
                step="0.1"
                value={form.slippage}
                onChange={(e) => setForm({ ...form, slippage: e.target.value })}
                className={inputClass}
                aria-label="Kayma"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                onClick={runBacktest}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label="Backtest çalıştır"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {loading ? 'Çalışıyor...' : 'Çalıştır'}
              </button>
            </div>
          </div>
          {loadError && <p className="mt-3 text-xs text-destructive">{loadError}</p>}
        </Card>

        {loading && !result && (
          <LoadingCard
            title="Backtest çalıştırılıyor..."
            description="Geçmiş veriler işleniyor ve kararlar değerlendiriliyor"
          />
        )}

        {error && !result && <ErrorCard message={error} onRetry={runBacktest} />}

        {!loading && !error && !result && (
          <EmptyState
            title="Backtest başlatın"
            description="Yukarıdaki parametreleri ayarlayıp çalıştırarak erken fırsat kararlarını geçmiş verilerle doğrulayın"
            icon={<FlaskConical className="h-8 w-8 text-muted-foreground" />}
          />
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                title="Kazanma Oranı"
                value={formatNumber(result.summary.winRate, '%')}
                description={`${result.decisionsEvaluated} karar değerlendirildi`}
                icon={Target}
                variant={result.summary.winRate >= 50 ? 'success' : 'warning'}
              />
              <StatCard
                title="Ortalama Getiri"
                value={formatNumber(result.summary.averageReturn, '%')}
                description={`Medyan: ${formatNumber(result.summary.medianReturn, '%')}`}
                icon={FlaskConical}
                variant={result.summary.averageReturn >= 0 ? 'success' : 'danger'}
              />
              <StatCard
                title="Max Drawdown"
                value={formatNumber(result.summary.maxDrawdown, '%')}
                description="Maksimum geri çekilme"
                icon={ShieldAlert}
                variant={result.summary.maxDrawdown > 20 ? 'danger' : 'default'}
              />
              <StatCard
                title="Yanlış Pozitif"
                value={result.summary.falsePositiveCount}
                description={`Kaçırılan fırsat: ${result.summary.missedOpportunityCount}`}
                icon={FlaskConical}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={qualityVariant(result.summary.sampleQuality)}>
                Örnek Kalitesi: {result.summary.sampleQuality}
              </Badge>
              <Badge variant="outline">Survivorship: {result.summary.survivorshipWarning}</Badge>
              <Badge variant={result.summary.pointInTimeVerified ? 'success' : 'warning'}>
                {result.summary.pointInTimeVerified
                  ? 'Point-in-time doğrulandı'
                  : 'Point-in-time doğrulanmadı'}
              </Badge>
              {result.summary.benchmarkExcessReturn != null && (
                <Badge variant={result.summary.benchmarkExcessReturn >= 0 ? 'success' : 'danger'}>
                  Benchmark Aşımı: {formatNumber(result.summary.benchmarkExcessReturn, '%')}
                </Badge>
              )}
            </div>

            <SectionTitle
              title="Karar Tablosu"
              description="Değerlendirilen kararlar ve gerçekleşen getiriler"
            />
            <DataTable
              columns={[
                { key: 'ticker', header: 'Sembol', width: '90px', sortable: true },
                { key: 'decisionDate', header: 'Karar Tarihi', width: '120px', sortable: true },
                { key: 'decision', header: 'Karar', width: '90px' },
                { key: 'eliteScore', header: 'Elite', width: '80px', sortable: true },
                { key: 'confidence', header: 'Güven', width: '80px', sortable: true },
                { key: 'expectedReturn', header: 'Beklenen (%)', width: '100px', sortable: true },
                {
                  key: 'realizedReturn',
                  header: 'Gerçekleşen (%)',
                  width: '110px',
                  sortable: true,
                },
                { key: 'return1M', header: '1A (%)', width: '80px', sortable: true },
                { key: 'excessReturn', header: 'Aşım (%)', width: '90px', sortable: true },
                { key: 'outcome', header: 'Sonuç', width: '90px' },
                { key: 'dataQuality', header: 'Veri Kalitesi', width: '110px' },
              ]}
              data={result.decisionTable.map((d) => ({
                ticker: d.ticker,
                decisionDate: new Date(d.decisionDate).toLocaleDateString('tr-TR'),
                decision: d.decision,
                eliteScore: formatNumber(d.eliteScore),
                confidence: formatNumber(d.confidence),
                expectedReturn: formatNumber(d.expectedReturn),
                realizedReturn: formatNumber(d.realizedReturn),
                return1M: formatNumber(d.return1M),
                excessReturn: formatNumber(d.excessReturn),
                outcome: d.outcome,
                dataQuality: d.dataQuality,
              }))}
              pageSize={20}
              emptyMessage="Karar verisi yok"
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card title="Yanlış Pozitifler" description="False positive analizi">
                {failures ? (
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                    {JSON.stringify(failures, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Veri mevcut değil.</p>
                )}
              </Card>
              <Card title="Kaçırılan Fırsatlar" description="Missed opportunity analizi">
                {missed ? (
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                    {JSON.stringify(missed, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Veri mevcut değil.</p>
                )}
              </Card>
              <Card title="Güven Kalibrasyonu" description="Confidence calibration">
                {calibration ? (
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                    {JSON.stringify(calibration, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Veri mevcut değil.</p>
                )}
              </Card>
              <Card title="Erken Tespit Süresi" description="Lead time analizi">
                {leadTime ? (
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                    {JSON.stringify(leadTime, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Veri mevcut değil.</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
