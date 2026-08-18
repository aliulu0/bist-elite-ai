import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ClipboardList,
  Activity,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, ErrorCard, LoadingCard, EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { sdkClient } from '@/lib/sdk';

interface RadarMetricsDetail {
  earlyOpportunityScore: number;
  eliteScore: number;
  signalConvergence: number;
  confidence: number;
  expectedReturn: number;
  risk: string;
  smartMoneyScore: number | null;
  catalystScore: number | null;
  fundamentalScore: number | null;
  dataQualityScore: number | null;
  predictionConfidence: number | null;
  timeframeAgreement: number | null;
  entryZone: { min: number; max: number } | null;
  decisionScore: number | null;
  decisionStatus: string | null;
  earlyOpportunity: boolean;
  dataTimestamp: string;
}

interface RadarDetailItem {
  ticker: string;
  company: string;
  sector: string;
  state: string;
  current: RadarMetricsDetail;
  previous: RadarMetricsDetail | null;
  scoreChange: number | null;
  changes: Array<{
    factor: string;
    label: string;
    previous: number | null;
    current: number | null;
    delta: number | null;
  }>;
  reasons: string[];
  radarPriority: number;
  dataFreshness: string;
  providerStatus: string | null;
  evaluatedAt: string;
}

interface RadarDetailResponse {
  item: RadarDetailItem;
  previousState: string | null;
  scoreHistory: Array<{ timestamp: string; score: number; state: string }>;
}

function stateVariant(
  state: string,
): 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'default' {
  switch (state) {
    case 'NEW':
      return 'info';
    case 'STRENGTHENING':
    case 'CONFIRMED':
      return 'success';
    case 'WEAKENING':
      return 'warning';
    case 'INVALIDATED':
      return 'danger';
    default:
      return 'outline';
  }
}

function stateLabel(state: string): string {
  switch (state) {
    case 'NEW':
      return 'YENİ';
    case 'STRENGTHENING':
      return 'GÜÇLENİYOR';
    case 'CONFIRMED':
      return 'DOĞRULANDI';
    case 'WEAKENING':
      return 'ZAYIFLIYOR';
    case 'INVALIDATED':
      return 'GEÇERSİZ';
    case 'UNCHANGED':
      return 'DEĞİŞMEDİ';
    default:
      return state;
  }
}

function formatMetric(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return '--';
  return `${value.toFixed(1)}${suffix}`;
}

function MetricRow({
  label,
  value,
  prev,
  suffix,
}: {
  label: string;
  value: number | null | undefined;
  prev?: number | null | undefined;
  suffix?: string;
}) {
  const delta = value != null && prev != null ? value - prev : null;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium">
        {delta != null && delta !== 0 && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-[10px]',
              delta > 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta > 0 ? '+' : ''}
            {delta.toFixed(1)}
          </span>
        )}
        {formatMetric(value, suffix)}
      </span>
    </div>
  );
}

export default function RadarDetailPage() {
  const { ticker = '' } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<RadarDetailResponse | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    setError('');
    try {
      const [detailRes, explainRes] = await Promise.all([
        sdkClient.radar.ticker(ticker),
        sdkClient.radar.explain(ticker),
      ]);
      setData(detailRes as unknown as RadarDetailResponse);
      setExplanation((explainRes as unknown as { explanation: string | null }).explanation ?? null);
    } catch {
      setError(`Radar verisi bulunamadı: ${ticker}`);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const submitFeedback = useCallback(
    async (action: 'CONFIRM' | 'REJECT' | 'IGNORE') => {
      setSubmitting(true);
      setFeedbackResult(null);
      try {
        await sdkClient.radar.feedback(ticker, { userAction: action, explanation: feedback });
        setFeedbackResult(
          action === 'CONFIRM'
            ? 'Onay kaydedildi'
            : action === 'REJECT'
              ? 'Red kaydedildi'
              : 'Göz ardı edildi',
        );
        setFeedback('');
      } catch {
        setFeedbackResult('Geri bildirim kaydedilemedi');
      } finally {
        setSubmitting(false);
      }
    },
    [ticker, feedback],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <LoadingCard title="Radar detayı yükleniyor..." description={ticker} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <ErrorCard message={error} onRetry={fetchDetail} />
        <div className="mt-4">
          <Link
            to="/radar"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Radara dön
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <EmptyState title="Veri yok" description="Bu sembol için radar detayı bulunamadı" />
      </div>
    );
  }

  const { item, scoreHistory } = data;
  const c = item.current;

  const scoreHistoryRows = scoreHistory.map((h, i) => ({
    index: i + 1,
    timestamp: new Date(h.timestamp).toLocaleString('tr-TR'),
    score: h.score,
    state: h.state,
  }));

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <PageHeader
        title={`${item.ticker} — Radar Detayı`}
        description={item.company}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/radar')}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Radar
            </button>
            <button
              onClick={() => navigate(`/stock/${item.ticker}`)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Hisse Sayfası
            </button>
          </div>
        }
      />

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <Badge variant={stateVariant(item.state)}>{stateLabel(item.state)}</Badge>
        <Badge variant="outline">{item.sector}</Badge>
        <Badge variant="outline">Öncelik: {item.radarPriority}</Badge>
        <Badge variant={c.earlyOpportunity ? 'success' : 'outline'}>
          {c.earlyOpportunity ? 'Erken Fırsat' : 'Standart'}
        </Badge>
        {item.providerStatus && <Badge variant="info">{item.providerStatus}</Badge>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <StatCard
          title="Erken Fırsat Skoru"
          value={formatMetric(c.earlyOpportunityScore)}
          change={item.scoreChange ?? undefined}
          description="Son taramaya göre değişim"
          icon={Activity}
          variant={c.earlyOpportunityScore >= 70 ? 'success' : 'default'}
        />
        <StatCard
          title="Güven"
          value={formatMetric(c.confidence)}
          description="Analiz güven skoru"
          icon={ClipboardList}
        />
        <StatCard
          title="Beklenen Getiri"
          value={formatMetric(c.expectedReturn, '%')}
          description={
            (c.expectedReturn ?? 0) >= 10 ? 'Yüksek getiri potansiyeli' : 'Düşük getiri beklentisi'
          }
          icon={Target}
          variant={(c.expectedReturn ?? 0) >= 10 ? 'success' : 'default'}
        />
        <StatCard
          title="Risk"
          value={c.risk ?? '--'}
          description="Risk seviyesi"
          icon={ShieldAlert}
          variant={
            c.risk === 'low'
              ? 'success'
              : c.risk === 'medium'
                ? 'warning'
                : c.risk === 'high'
                  ? 'danger'
                  : 'default'
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Faktör Detayları"
          description="Alt analiz faktör skorları"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <MetricRow label="Elite Skor" value={c.eliteScore} prev={item.previous?.eliteScore} />
            <MetricRow
              label="Sinyal Yakınsaması"
              value={c.signalConvergence}
              prev={item.previous?.signalConvergence}
            />
            <MetricRow
              label="Zaman Dilimi Uyumu"
              value={c.timeframeAgreement}
              prev={item.previous?.timeframeAgreement}
            />
            <MetricRow
              label="Tahmin Güveni"
              value={c.predictionConfidence}
              prev={item.previous?.predictionConfidence}
            />
            <MetricRow
              label="Smart Money Skoru"
              value={c.smartMoneyScore}
              prev={item.previous?.smartMoneyScore}
            />
            <MetricRow
              label="Katalizör Skoru"
              value={c.catalystScore}
              prev={item.previous?.catalystScore}
            />
            <MetricRow
              label="Temel Skor"
              value={c.fundamentalScore}
              prev={item.previous?.fundamentalScore}
            />
            <MetricRow
              label="Veri Kalitesi Skoru"
              value={c.dataQualityScore}
              prev={item.previous?.dataQualityScore}
            />
          </div>
        </Card>

        <Card title="Giriş Bölgesi" description="Önerilen fiyat aralığı">
          {c.entryZone && c.entryZone.min > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Alt sınır</span>
                <span className="text-sm font-semibold">{c.entryZone.min.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Üst sınır</span>
                <span className="text-sm font-semibold">{c.entryZone.max.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Bu aralıkta giriş yapılması önerilir. Bilgi amaçlıdır, yatırım tavsiyesi değildir.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bu sembol için giriş bölgesi hesaplanmamış (veri mevcut değil).
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Karar (Decision)" description="Otomatik karar motoru çıktısı">
          {c.decisionStatus ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Karar Skoru</span>
                <Badge
                  variant={
                    c.decisionScore != null && c.decisionScore >= 70
                      ? 'success'
                      : c.decisionScore != null && c.decisionScore >= 40
                        ? 'warning'
                        : 'default'
                  }
                >
                  {formatMetric(c.decisionScore)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Karar Durumu</span>
                <Badge variant="outline">{c.decisionStatus}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bu sembol için karar verisi mevcut değil.
            </p>
          )}

          <div className="mt-4">
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">Radar Açıklaması</h4>
            <p className="rounded-md border bg-muted/30 p-3 text-sm">
              {explanation || 'Bu sembol için açıklama üretilemedi.'}
            </p>
          </div>

          <div className="mt-4">
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">Değişim Nedenleri</h4>
            {item.changes.length > 0 ? (
              <ul className="space-y-1">
                {item.changes.map((ch) => (
                  <li
                    key={ch.factor}
                    className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-1.5 text-xs"
                  >
                    <span>{ch.label}</span>
                    <span
                      className={cn(
                        'font-medium',
                        (ch.delta ?? 0) > 0
                          ? 'text-success'
                          : (ch.delta ?? 0) < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                      )}
                    >
                      {ch.previous?.toFixed(1) ?? '--'} → {ch.current?.toFixed(1) ?? '--'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Faktör değişimi bulunmuyor.</p>
            )}
          </div>
        </Card>

        <Card
          title="Nedenler & Geri Bildirim"
          description="Tarama nedenleri ve kullanıcı geri bildirimi"
        >
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Tarama Nedenleri</h4>
          {item.reasons.length > 0 ? (
            <ul className="mb-4 space-y-1">
              {item.reasons.map((r, i) => (
                <li key={i} className="rounded-md bg-muted/30 px-3 py-1.5 text-xs">
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">
              Bu sembol için tarama nedeni bulunmuyor.
            </p>
          )}

          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Geri Bildirim Ver</h4>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Bu fırsat için açıklama (opsiyonel)"
            rows={2}
            className="w-full rounded-md border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Geri bildirim açıklaması"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => submitFeedback('CONFIRM')}
              disabled={submitting}
              className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Onayla
            </button>
            <button
              onClick={() => submitFeedback('REJECT')}
              disabled={submitting}
              className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Reddet
            </button>
            <button
              onClick={() => submitFeedback('IGNORE')}
              disabled={submitting}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Es Geç
            </button>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          {feedbackResult && <p className="mt-2 text-xs text-muted-foreground">{feedbackResult}</p>}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Skor Geçmişi" description="Bu sembolün radar geçmişindeki skor değişimi">
          {scoreHistoryRows.length > 0 ? (
            <DataTable
              columns={[
                { key: 'index', header: '#', width: '50px' },
                { key: 'timestamp', header: 'Tarih', width: '200px' },
                { key: 'score', header: 'Skor', width: '100px' },
                { key: 'state', header: 'Durum', width: '120px' },
              ]}
              data={scoreHistoryRows}
              pageSize={10}
            />
          ) : (
            <EmptyState
              title="Geçmiş yok"
              description="Bu sembol için skor geçmişi kaydedilmemiş"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
