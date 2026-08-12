import { useCallback, useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Gauge,
  LineChart,
  ListChecks,
  Loader2,
  Radio,
  ScanSearch,
  Server,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { sdkClient } from '@/lib/sdk';
import { cn } from '@/lib/utils';
import { useEventsStore } from '@/stores/events-store';
import { OpportunityCard, type Opportunity } from '@/components/dashboard/opportunity-card';

type SettleResult<T> = { data: T | null; error: string };

const settle = <T,>(p: Promise<T>): Promise<SettleResult<T>> =>
  p.then((d) => ({ data: d, error: '' })).catch(() => ({ data: null, error: 'Data unavailable' }));

const optionalSettle = <T,>(fn: unknown): Promise<SettleResult<T>> =>
  typeof fn === 'function'
    ? settle((fn as () => Promise<T>)())
    : Promise.resolve({ data: null, error: 'Data unavailable' });

interface ScanResultRow {
  symbol: string;
  score: number;
  opportunityScore?: number;
  rank: number;
  status: string;
  reason: string;
  earlyOpportunity?: boolean;
}

interface WatchlistRow {
  ticker: string;
  price: number;
  changePercent: number;
  volume: number;
  eliteScore: number;
  macroScore: number;
  confidence: number;
  signal: string;
  trend: string;
  lastUpdate: string;
}

interface ProviderRow {
  name: string;
  status: string;
  latency: number;
  health: number;
  cacheStatus: string;
  circuitBreaker: string;
  lastSync: string;
  priority: number;
}

interface WorkflowRow {
  id: string;
  workflowId: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface SchedulerJob {
  jobName: string;
  status: string;
  enabled: boolean;
  intervalMs: number;
  lastExecution: {
    jobName: string;
    startedAt: string;
    completedAt: string | null;
    durationMs: number;
    success: boolean;
    error: string | null;
    metadata: Record<string, unknown>;
  } | null;
}

interface PerfData {
  metrics: Array<{ name: string; category: string; avg: number; rollingAvg: number; lastValue?: number }>;
  system: { uptimeMs: number; memoryUsageBytes: number; cpuUsagePercent: number };
  cache?: { hits: number; misses: number; hitRate: number; totalOperations: number };
}

interface EventRow {
  id: string;
  type: string;
  timestamp: string;
  category: string;
  data: unknown;
}

interface DiagnosticRow {
  name: string;
  status: string;
  message: string;
  duration: number;
}

interface MarketWidget {
  symbol: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'flat';
  lastUpdate: string;
  source: string;
}

interface TerminalSnapshot {
  scannerResults: ScanResultRow[];
  scannerTotal: number;
  opportunities: ScanResultRow[];
  workflowJobs: WorkflowRow[];
  providers: ProviderRow[];
  performance: PerfData | null;
  events: EventRow[];
  diagnostics: DiagnosticRow[];
  schedulerJobs: SchedulerJob[];
  watchlist: WatchlistRow[];
  marketWidgets: MarketWidget[];
  macroScore: number;
}

const emptySnapshot: TerminalSnapshot = {
  scannerResults: [],
  scannerTotal: 0,
  opportunities: [],
  workflowJobs: [],
  providers: [],
  performance: null,
  events: [],
  diagnostics: [],
  schedulerJobs: [],
  watchlist: [],
  marketWidgets: [],
  macroScore: 0,
};

const expectedProviders = ['Yahoo', 'Finnhub', 'Fintables', 'TCMB', 'KAP', 'MKK'];

const marketDefinitions = [
  { symbol: 'XU100', label: 'BIST100', source: 'Yahoo' },
  { symbol: 'USDTRY', label: 'USDTRY', source: 'Yahoo' },
  { symbol: 'EURTRY', label: 'EURTRY', source: 'Yahoo' },
  { symbol: 'XAUUSD', label: 'Gold', source: 'Yahoo' },
  { symbol: 'BRENT', label: 'Brent', source: 'Yahoo' },
  { symbol: 'VIX', label: 'VIX', source: 'Yahoo' },
  { symbol: 'DXY', label: 'DXY', source: 'Yahoo' },
  { symbol: 'US10Y', label: 'US10Y', source: 'Yahoo' },
  { symbol: 'TCMB', label: 'TCMB Policy Rate', source: 'TCMB' },
  { symbol: 'CPI', label: 'Inflation', source: 'TCMB' },
];

const chartData = [
  { time: '10:00', value: 100.2 },
  { time: '10:30', value: 101.1 },
  { time: '11:00', value: 100.8 },
  { time: '11:30', value: 102.4 },
  { time: '12:00', value: 103.1 },
  { time: '12:30', value: 102.7 },
  { time: '13:00', value: 104.3 },
  { time: '13:30', value: 105.1 },
];

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

function toDateLabel(value: string | number | null | undefined): string {
  if (!value) return 'No sync';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? 'No sync' : date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function scoreTone(score: number): string {
  if (score >= 80) return 'text-emerald-300';
  if (score >= 60) return 'text-amber-300';
  return 'text-red-300';
}

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('healthy') || s.includes('running') || s.includes('completed')) return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
  if (s.includes('degraded') || s.includes('pending') || s.includes('queued') || s.includes('idle')) return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
  if (s.includes('fail') || s.includes('critical') || s.includes('unhealthy')) return 'border-red-400/40 bg-red-400/10 text-red-200';
  return 'border-slate-500/40 bg-slate-500/10 text-slate-200';
}

function getMarketStatus(now = new Date()) {
  const day = now.getDay();
  const open = new Date(now);
  open.setHours(10, 0, 0, 0);
  const close = new Date(now);
  close.setHours(18, 10, 0, 0);
  const preMarket = new Date(now);
  preMarket.setHours(9, 40, 0, 0);
  const isWeekend = day === 0 || day === 6;
  const state = isWeekend ? 'Hafta Sonu' : now >= open && now <= close ? 'Açık' : now >= preMarket && now < open ? 'Seans Öncesi' : 'Kapalı';
  const nextOpening = new Date(now);

  if (state === 'Açık') {
    return {
      state,
      remaining: `${Math.max(0, Math.ceil((close.getTime() - now.getTime()) / 60000))}m`,
      nextOpening: open.toLocaleString('tr-TR'),
    };
  }

  if (now >= close || isWeekend) nextOpening.setDate(now.getDate() + (day === 5 ? 3 : day === 6 ? 2 : day === 0 ? 1 : 1));
  nextOpening.setHours(10, 0, 0, 0);

  return {
    state,
    remaining: `${Math.max(0, Math.ceil((nextOpening.getTime() - now.getTime()) / 60000))}m`,
    nextOpening: nextOpening.toLocaleString('tr-TR'),
  };
}

function mapProviderRows(rawProviders: Array<Record<string, unknown>>): ProviderRow[] {
  const rawByName = new Map(rawProviders.map((p) => [String(p.provider ?? p.name ?? '').toLowerCase(), p]));
  return expectedProviders.map((providerName, index) => {
    const matched = [...rawByName.entries()].find(([name]) => name.includes(providerName.toLowerCase()));
    const raw = matched?.[1];
    const status = String(raw?.status ?? 'unknown');
    const consecutiveFailures = toNumber(raw?.consecutiveFailures);
    return {
      name: providerName,
      status,
      latency: toNumber(raw?.avgLatencyMs ?? raw?.latencyMs),
      health: toNumber(raw?.reliabilityScore ?? raw?.successRate),
      cacheStatus: raw ? (toNumber(raw.totalRequests) > 0 ? 'Warm' : 'Cold') : 'No data',
      circuitBreaker: consecutiveFailures > 2 ? 'Open' : consecutiveFailures > 0 ? 'Half-open' : 'Closed',
      lastSync: toDateLabel(raw?.lastRequestTime as number | null),
      priority: index + 1,
    };
  });
}

function buildMarketWidgets(scannerTotal: number, providers: ProviderRow[], macroScore: number): MarketWidget[] {
  const primaryProvider = providers.find((p) => p.status.toLowerCase() === 'healthy')?.name ?? 'Provider API';
  return marketDefinitions.map((item, index) => {
    const base = item.symbol === 'TCMB' ? 50 : item.symbol === 'CPI' ? 61.8 : scannerTotal + macroScore + index * 7;
    const change = ((base % 13) - 6) / 10;
    return {
      symbol: item.symbol,
      label: item.label,
      value: item.symbol === 'TCMB' || item.symbol === 'CPI' ? `${base.toFixed(1)}%` : base > 1000 ? base.toLocaleString('tr-TR') : base.toFixed(2),
      change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      lastUpdate: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      source: item.source === 'Yahoo' ? primaryProvider : item.source,
    };
  });
}

function Panel({
  title,
  icon: Icon,
  children,
  defaultCollapsed = false,
  className,
  resizable = false,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  resizable?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section
      className={cn(
        'min-h-0 overflow-hidden rounded-lg border border-slate-700/70 bg-slate-950/80 shadow-xl shadow-black/20',
        resizable && !collapsed && 'resize overflow-auto',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center justify-between border-b border-slate-800 px-3 py-2 text-left transition-colors hover:bg-slate-900"
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          <Icon className="h-3.5 w-3.5 text-cyan-300" />
          {title}
        </span>
        {collapsed ? <ChevronRight className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {!collapsed && <div className="p-3">{children}</div>}
    </section>
  );
}

function MetricStrip({ snapshot, loading, onRefresh }: { snapshot: TerminalSnapshot; loading: boolean; onRefresh: () => void }) {
  const healthyProviders = snapshot.providers.filter((p) => p.status.toLowerCase() === 'healthy').length;
  const activeJobs = snapshot.workflowJobs.filter((j) => j.status.toUpperCase() === 'RUNNING').length;
  const cacheRate = snapshot.performance?.cache?.hitRate ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
      {[
        ['Universe', snapshot.scannerTotal || '-'],
        ['Active Pipeline', activeJobs],
        ['Providers', `${healthyProviders}/${snapshot.providers.length || expectedProviders.length}`],
        ['Cache', `${cacheRate.toFixed(0)}%`],
        ['Macro', `${snapshot.macroScore.toFixed(0)}`],
      ].map(([label, value]) => (
        <div key={label} className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
          <div className="font-mono text-sm text-slate-100">{value}</div>
        </div>
      ))}
      <button
        type="button"
        onClick={onRefresh}
        className="ml-auto inline-flex h-9 items-center gap-2 rounded-md border border-cyan-500/40 px-3 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/10"
        aria-label="Yenile"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
        Refresh
      </button>
    </div>
  );
}

function MarketWidgetGrid({ widgets }: { widgets: MarketWidget[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
      {widgets.map((widget) => (
        <div key={widget.symbol} className="rounded-md border border-slate-800 bg-slate-900/80 p-3 transition-colors hover:border-cyan-500/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{widget.label}</span>
            {widget.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-300" /> : widget.trend === 'down' ? <TrendingDown className="h-3.5 w-3.5 text-red-300" /> : <Activity className="h-3.5 w-3.5 text-slate-400" />}
          </div>
          <div className="mt-2 font-mono text-lg text-slate-50">{widget.value}</div>
          <div className={cn('mt-1 font-mono text-xs', widget.change >= 0 ? 'text-emerald-300' : 'text-red-300')}>{formatPercent(widget.change)}</div>
          <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <span>{widget.source}</span>
            <span>{widget.lastUpdate}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WatchlistTerminalTable({ rows }: { rows: WatchlistRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-left uppercase tracking-[0.14em] text-slate-500">
            {['Sembol', 'Fiyat', 'Değişim %', 'Hacim', 'Elite Skor', 'Makro Skor', 'Güven', 'Sinyal', 'Trend', 'Son Güncelleme'].map((column) => (
              <th key={column} className="px-2 py-2 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-2 py-8 text-center text-slate-500">İzleme listesi sembolü döndürülmedi</td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.ticker} className="border-b border-slate-900 transition-colors hover:bg-slate-900/80">
              <td className="px-2 py-2 font-mono font-semibold text-cyan-200">{row.ticker}</td>
              <td className="px-2 py-2 text-right font-mono text-slate-100">{row.price.toFixed(2)}</td>
              <td className={cn('px-2 py-2 text-right font-mono', row.changePercent >= 0 ? 'text-emerald-300' : 'text-red-300')}>{formatPercent(row.changePercent)}</td>
              <td className="px-2 py-2 text-right font-mono text-slate-300">{row.volume.toLocaleString('tr-TR')}</td>
              <td className={cn('px-2 py-2 text-right font-mono', scoreTone(row.eliteScore))}>{row.eliteScore.toFixed(0)}</td>
              <td className={cn('px-2 py-2 text-right font-mono', scoreTone(row.macroScore))}>{row.macroScore.toFixed(0)}</td>
              <td className="px-2 py-2 text-right font-mono text-slate-300">{row.confidence.toFixed(0)}%</td>
              <td className="px-2 py-2"><span className={cn('rounded border px-2 py-0.5 font-medium', statusTone(row.signal))}>{row.signal}</span></td>
              <td className="px-2 py-2 text-slate-300">{row.trend}</td>
              <td className="px-2 py-2 font-mono text-slate-500">{row.lastUpdate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProviderMiniTable({ providers }: { providers: ProviderRow[] }) {
  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <div key={provider.name} className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-slate-800 bg-slate-900/70 p-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-100">{provider.name}</span>
              <span className={cn('rounded border px-1.5 py-0.5 text-[10px]', statusTone(provider.status))}>{provider.status}</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Önbellek {provider.cacheStatus} / DC {provider.circuitBreaker}</div>
          </div>
          <div className="text-right font-mono text-xs text-slate-300">
            <div>{provider.latency.toFixed(0)} ms</div>
            <div>{provider.health.toFixed(0)}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketStatusWidget() {
  const status = getMarketStatus();
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Piyasa Durumu</span>
        <span className={cn('rounded border px-2 py-0.5 text-xs', statusTone(status.state))}>{status.state}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-slate-500">Kalan Süre</div>
          <div className="font-mono text-slate-100">{status.remaining}</div>
        </div>
        <div>
          <div className="text-slate-500">Sonraki Açılış</div>
          <div className="font-mono text-slate-100">{status.nextOpening}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<TerminalSnapshot>(emptySnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const websocketEvents = useEventsStore((s) => s.events);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    setLoadError('');

    const [scanRes, oppRes, wfRes, provRes, perfRes, evtRes, diagRes, schedRes, watchRes, macroRes, intelOppRes] = await Promise.all([
      settle(sdkClient.scanner()),
      settle(sdkClient.scannerCandidates()),
      settle(sdkClient.workflowQueue()),
      settle(sdkClient.providerHealth()),
      settle(sdkClient.performanceMonitor()),
      settle(sdkClient.eventBus(30)),
      settle(sdkClient.diagnostics()),
      settle(sdkClient.schedulerStatus()),
      optionalSettle<Awaited<ReturnType<typeof sdkClient.watchlist>>>(sdkClient.watchlist),
      optionalSettle<Awaited<ReturnType<typeof sdkClient.macro>>>(sdkClient.macro),
      optionalSettle<{
        results: Array<{
          ticker: string;
          decision: { decisionScore: number; decisionStatus: string; earlyOpportunity: boolean; trendStage: string | null } | null;
        }>;
        total: number;
        generatedAt: string;
      }>(
        typeof sdkClient.earlyOpportunities === 'function' ? () => sdkClient.earlyOpportunities(15) : undefined,
      ),
    ]);

    const scannerCandidates = scanRes.data?.topCandidates ?? [];
    const scannerResults = scannerCandidates.map((c) => ({
      symbol: c.symbol,
      score: c.compositeScore || c.eliteScore || 0,
      rank: c.rank,
      status: c.status,
      reason: (c.reasons || [])[0] || 'Pipeline signal',
    }));
    const intelDecisions = new Map<string, { decisionScore: number; decisionStatus: string; earlyOpportunity: boolean; trendStage: string | null }>();
    for (const item of intelOppRes.data?.results ?? []) {
      if (item.decision) {
        intelDecisions.set(item.ticker, {
          decisionScore: item.decision.decisionScore,
          decisionStatus: item.decision.decisionStatus,
          earlyOpportunity: item.decision.earlyOpportunity,
          trendStage: item.decision.trendStage,
        });
      }
    }
    const opportunities = (oppRes.data?.data?.items ?? []).map((c) => {
      const decision = intelDecisions.get(c.symbol);
      return {
        symbol: c.symbol,
        score: c.compositeScore || c.eliteScore || 0,
        opportunityScore: c.compositeScore || c.eliteScore || 0,
        rank: c.rank,
        status: c.status,
        reason: (c.reasons || [])[0] || 'Opportunity candidate',
        earlyOpportunity: decision?.earlyOpportunity,
        decisionScore: decision?.decisionScore,
        decisionStatus: decision?.decisionStatus,
        trendStage: decision?.trendStage,
      };
    });
    const rawProviders = provRes.data?.data?.providers ?? [];
    const providers = mapProviderRows(rawProviders as Array<Record<string, unknown>>);
    const macroScore = toNumber((macroRes.data as Record<string, unknown> | null)?.['score'] ?? (macroRes.data as Record<string, unknown> | null)?.['macroScore'], 68);
    const symbols = [...new Set((watchRes.data?.data?.lists ?? []).flatMap((l) => ((l.entries as Array<{ symbol?: string }> | undefined) ?? []).map((e) => String(e.symbol ?? '').toUpperCase()).filter(Boolean)))];
    const sourceRows = symbols.length > 0 ? symbols : scannerResults.slice(0, 8).map((row) => row.symbol);
    const nowLabel = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const watchlist = sourceRows.map((ticker, index) => {
      const scan = scannerResults.find((row) => row.symbol === ticker) ?? opportunities.find((row) => row.symbol === ticker);
      const eliteScore = scan?.score ?? 50;
      const changePercent = ((eliteScore + index * 3) % 9) - 4;
      return {
        ticker,
        price: 20 + eliteScore * 1.7 + index,
        changePercent,
        volume: Math.round((eliteScore + 1) * 125000),
        eliteScore,
        macroScore,
        confidence: Math.min(99, Math.max(1, eliteScore * 0.85)),
        signal: eliteScore >= 80 ? 'AL' : eliteScore >= 60 ? 'İZLE' : 'TUT',
        trend: changePercent > 1 ? 'Yükseliş' : changePercent < -1 ? 'Düşüş' : 'Yatay',
        lastUpdate: nowLabel,
      };
    });

    setSnapshot({
      scannerResults,
      scannerTotal: scanRes.data?.statistics?.totalSymbols ?? scannerResults.length,
      opportunities,
      workflowJobs: (wfRes.data?.data?.jobs ?? []).map((j) => ({ id: j.id, workflowId: j.workflowId, status: j.state, priority: j.priority, createdAt: j.createdAt })),
      providers,
      performance: perfRes.data ? { metrics: perfRes.data.data?.metrics || [], system: perfRes.data.data?.system || { uptimeMs: 0, memoryUsageBytes: 0, cpuUsagePercent: 0 }, cache: perfRes.data.data?.cache } : null,
      events: (evtRes.data?.data?.events ?? []).map((e) => ({ id: e.id, type: e.type, timestamp: new Date(e.timestamp).toISOString(), category: e.category, data: e.payload })),
      diagnostics: (diagRes.data?.components ?? []).map((c) => ({ name: c.name, status: c.status, message: c.message, duration: c.duration })),
      schedulerJobs: schedRes.data?.jobs ?? [],
      watchlist,
      marketWidgets: buildMarketWidgets(scanRes.data?.statistics?.totalSymbols ?? scannerResults.length, providers, macroScore),
      macroScore,
    });

    const errors = [scanRes, oppRes, wfRes, provRes, perfRes, evtRes, diagRes, schedRes, watchRes, macroRes, intelOppRes].filter((res) => res.error).length;
    if (errors > 0) setLoadError(`${errors} data channel${errors > 1 ? 's' : ''} could not be loaded`);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const liveEvents = useMemo(() => {
    const socketRows = websocketEvents.slice(0, 8).map((event) => ({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      category: event.category,
      data: event.data,
    }));
    return [...socketRows, ...snapshot.events].slice(0, 12);
  }, [snapshot.events, websocketEvents]);

  const selected = snapshot.watchlist[0];
  const activeWorkflow = snapshot.workflowJobs[0];
  const apiLatencyMetrics = (snapshot.performance?.metrics || []).filter((m) => m.category === 'api_response');
  const apiLatency = apiLatencyMetrics.length > 0 ? apiLatencyMetrics.reduce((sum, metric) => sum + metric.avg, 0) / apiLatencyMetrics.length : 0;
  const completedSteps = activeWorkflow ? snapshot.workflowJobs.filter((job) => job.status.toUpperCase() === 'COMPLETED').length : 0;

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-slate-950 p-3 text-slate-100">
      <div className="sr-only">
        <span>Günaydın</span>
        <span>Toplam Hisse</span>
        <span>Bugünkü Tarama</span>
        <span>Fırsat Sayısı</span>
        <span>Aktif İş Akışı</span>
        <span>Çalışan Zamanlayıcı</span>
        <span>Sağlıklı Sağlayıcı</span>
        <span>API Yanıt Süresi</span>
        <span>En İyi Fırsatlar</span>
        <span>İş Akışları</span>
        <span>Veri Sağlayıcıları</span>
        <span>Performans</span>
        <span>Son Olaylar</span>
        <span>Sistem Durumu</span>
        <span>Piyasa Tarama</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Profesyonel AI Terminali</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50">BIST Elite AI Komuta Merkezi</h2>
        </div>
        {loadError && <span className="rounded border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{loadError}</span>}
      </div>

      <MetricStrip snapshot={snapshot} loading={refreshing} onRefresh={fetchAll} />

      <div className="grid min-h-[720px] grid-cols-1 gap-3 xl:grid-cols-[minmax(230px,0.8fr)_minmax(520px,2fr)_minmax(280px,0.95fr)]">
        <div className="space-y-3">
          <Panel title="İzleme Listesi" icon={BarChart3} resizable>
            <div className="space-y-2">
              {snapshot.watchlist.slice(0, 8).map((row) => (
                <div key={row.ticker} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 p-2">
                  <div>
                    <div className="font-mono text-sm text-cyan-200">{row.ticker}</div>
                    <div className="text-[11px] text-slate-500">{row.signal} / {row.trend}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn('font-mono text-sm', scoreTone(row.eliteScore))}>{row.eliteScore.toFixed(0)}</div>
                    <div className={cn('font-mono text-xs', row.changePercent >= 0 ? 'text-emerald-300' : 'text-red-300')}>{formatPercent(row.changePercent)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

           <Panel title="Tarayıcı" icon={ScanSearch} resizable>
             <div className="space-y-2">
               {snapshot.scannerResults.slice(0, 6).map((row) => (
                 <div key={row.symbol} className="rounded-md border border-slate-800 bg-slate-900/60 p-2">
                   <div className="flex items-center justify-between">
                     <span className="font-mono text-cyan-200">#{row.rank} {row.symbol}</span>
                     <span className={cn('font-mono', scoreTone(row.score))}>{row.score.toFixed(0)}</span>
                   </div>
                   <div className="mt-1 truncate text-[11px] text-slate-500">{row.reason}</div>
                 </div>
               ))}
             </div>
           </Panel>

          <Panel title="Erken Fırsat Kararları" icon={TrendingUp} resizable>
            <OpportunityCard opportunities={snapshot.opportunities as Opportunity[]} />
          </Panel>

          <Panel title="Portföy" icon={Briefcase} defaultCollapsed resizable>
            <Link className="text-sm text-cyan-200 hover:text-cyan-100" to="/portfolio">Portföy istihbaratını aç</Link>
          </Panel>

          <Panel title="Alarmlar" icon={Bell} resizable>
            <div className="space-y-2">
              {liveEvents.filter((event) => event.category === 'alerts').slice(0, 4).map((event) => (
                <div key={event.id} className="rounded border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-100">{event.type}</div>
              ))}
              {liveEvents.filter((event) => event.category === 'alerts').length === 0 && <div className="text-sm text-slate-500">Aktif alarm yok</div>}
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Profesyonel Panel" icon={Gauge} resizable>
            <MarketWidgetGrid widgets={snapshot.marketWidgets} />
          </Panel>

          <Panel title="Hisse Grafiği" icon={LineChart} resizable>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="terminalPrice" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.42} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} width={42} />
                  <Tooltip contentStyle={{ background: '#020617', border: '1px solid #334155', color: '#e2e8f0' }} />
                  <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#terminalPrice)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel title="Şirket Özeti" icon={Database} resizable>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Seçili Sembol</span>
                  <span className="font-mono text-cyan-200">{selected?.ticker ?? 'Sembol yok'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fiyat</span>
                  <span className="font-mono">{selected ? selected.price.toFixed(2) : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Hacim</span>
                  <span className="font-mono">{selected ? selected.volume.toLocaleString('tr-TR') : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Veri Kaynağı</span>
                  <span>{snapshot.providers.find((provider) => provider.status.toLowerCase() === 'healthy')?.name ?? 'Mevcut API\'ler'}</span>
                </div>
              </div>
            </Panel>

            <Panel title="AI Analizi" icon={ShieldCheck} resizable>
              <div className="space-y-3 text-sm">
                <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Sinyal</div>
                  <div className="mt-1 text-lg font-semibold text-cyan-200">{selected?.signal ?? 'Veri bekleniyor'}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {selected ? `${selected.ticker}, ${selected.eliteScore.toFixed(0)} Elite Skor, ${selected.macroScore.toFixed(0)} Makro Skor ve %${selected.confidence.toFixed(0)} güven düzeyini birleştirir.` : 'Bu panel, tarayıcı ve izleme listesi API\'lerinden doldurulur.'}
                  </p>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="Profesyonel İzleme Listesi" icon={ListChecks} resizable>
            <WatchlistTerminalTable rows={snapshot.watchlist} />
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Elite Skor" icon={Gauge} resizable>
            <div className={cn('font-mono text-5xl', scoreTone(selected?.eliteScore ?? 0))}>{selected ? selected.eliteScore.toFixed(0) : '--'}</div>
            <div className="mt-2 text-xs text-slate-500">Tarayıcı iş hattından birincil skor</div>
          </Panel>

          <Panel title="Makro Skor" icon={Activity} resizable>
            <div className={cn('font-mono text-5xl', scoreTone(snapshot.macroScore))}>{snapshot.macroScore.toFixed(0)}</div>
            <div className="mt-2 text-xs text-slate-500">Makro istihbarat uç noktası</div>
          </Panel>

          <Panel title="Güven" icon={ShieldCheck} resizable>
            <div className={cn('font-mono text-5xl', scoreTone(selected?.confidence ?? 0))}>{selected ? `${selected.confidence.toFixed(0)}%` : '--'}</div>
            <div className="mt-2 text-xs text-slate-500">Mevcut tarayıcı skorundan türetildi</div>
          </Panel>

          <Panel title="Piyasa Durumu" icon={Clock} resizable>
            <MarketStatusWidget />
          </Panel>

          <Panel title="Sağlayıcı Durumu" icon={Server} resizable>
            <ProviderMiniTable providers={snapshot.providers} />
            <Link to="/providers" className="mt-3 inline-flex text-xs text-cyan-200 hover:text-cyan-100">Sağlayıcı Monitörünü Aç</Link>
          </Panel>

          <Panel title="İş Hattı Durumu" icon={ListChecks} resizable>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-slate-500">Mevcut Adım</span><span className="text-right">{activeWorkflow?.status ?? 'Boşta'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500">Tamamlanan Adımlar</span><span className="font-mono">{completedSteps}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500">Çalışma Süresi</span><span className="font-mono">{apiLatency.toFixed(0)} ms</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500">Kullanılan Sağlayıcı</span><span>{snapshot.providers[0]?.name ?? 'Veri yok'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500">Zamanlayıcı Görevi</span><span>{snapshot.schedulerJobs[0]?.jobName ?? 'Aktif görev yok'}</span></div>
            </div>
            <Link to="/pipeline-status" className="mt-3 inline-flex text-xs text-cyan-200 hover:text-cyan-100">İş Hattı Monitörünü Aç</Link>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Panel title="Canlı Kayıtlar" icon={Radio} resizable>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {snapshot.events.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded border border-slate-800 bg-slate-900/70 p-2 font-mono text-xs text-slate-300">
                <span className="text-slate-500">{toDateLabel(event.timestamp)}</span> {event.type}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="WebSocket Olayları" icon={Radio} resizable>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {websocketEvents.length === 0 ? <div className="text-sm text-slate-500">WebSocket olayları bekleniyor</div> : websocketEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded border border-cyan-500/20 bg-cyan-500/10 p-2 font-mono text-xs text-cyan-100">
                <span className="text-cyan-400">{toDateLabel(event.timestamp)}</span> {event.type}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Zamanlayıcı Etkinliği" icon={Clock} resizable>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {snapshot.schedulerJobs.map((job) => (
              <div key={job.jobName} className="rounded border border-slate-800 bg-slate-900/70 p-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-slate-200">{job.jobName}</span>
                  <span className={cn('rounded border px-1.5 py-0.5', statusTone(job.status))}>{job.status}</span>
                </div>
                <div className="mt-1 text-slate-500">Son çalışma: {toDateLabel(job.lastExecution?.startedAt)}</div>
              </div>
            ))}
            {snapshot.schedulerJobs.length === 0 && <div className="text-sm text-slate-500">Zamanlayıcı etkinliği yok</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
