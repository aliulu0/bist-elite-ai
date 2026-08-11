import { useState, useCallback, useEffect } from 'react';
import { Briefcase, LayoutGrid, PieChart as PieIcon, Shield, ArrowUpDown, Coins, Brain, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolioStore } from '@/stores/portfolio-store';
import type { Holding, Transaction, CashBalance, RiskMetrics, AIAnalysis, DividendInfo, AllocationItem, PortfolioSummary } from '@/components/portfolio/portfolio-types';
import { PORTFOLIO_TAB } from '@/components/portfolio/portfolio-types';
import { buildAllocationFromHoldings, buildSectorAllocation } from '@/components/portfolio/portfolio-adapter';
import {
  PortfolioHeader, PortfolioSummaryCards, PortfolioPerformanceChart, PortfolioAllocationChart,
  PortfolioSectorChart, PortfolioHoldingsTable, PortfolioAIAnalysis, PortfolioRiskCard,
  PortfolioTransactions, PortfolioCashCard, PortfolioDividendCard,
} from '@/components/portfolio';
import { PortfolioAdvisor } from '@/components/portfolio/portfolio-advisor';
import { PortfolioOptimization } from '@/components/portfolio/portfolio-optimization';
import { PortfolioIntelligence } from '@/components/portfolio/portfolio-intelligence';
import { SkeletonCard } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { sdkClient } from '@/lib/sdk';

const EMPTY_SUMMARY: PortfolioSummary = {
  totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPercent: 0,
  dayPnl: 0, dayPnlPercent: 0, realizedPnl: 0, unrealizedPnl: 0,
  maxDrawdown: 0, volatility: 0, sharpeRatio: 0, aiScore: 0, cashBalance: 0,
};

const EMPTY_RISK: RiskMetrics = {
  beta: 0, volatility: 0, sharpeRatio: 0, sortinoRatio: 0,
  maxDrawdown: 0, valueAtRisk: 0, diversificationScore: 0, riskScore: 0,
};

const EMPTY_AI: AIAnalysis = {
  portfolioQuality: '', riskLevel: '', concentrationRisk: '',
  sectorRisk: '', liquidity: '', diversification: '',
  recommendations: [], warnings: [],
};

const EMPTY_DIVIDENDS: DividendInfo = {
  totalReceived: 0, expectedAnnual: 0, yieldPercent: 0,
  lastPaymentDate: '', lastPaymentAmount: 0, history: [],
};

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function riskLevel(riskScore: number): string {
  if (riskScore < 30) return 'LOW';
  if (riskScore < 60) return 'MEDIUM';
  return 'HIGH';
}

function mapHolding(position: Record<string, unknown>): Holding {
  return {
    symbol: String(position.symbol ?? ''),
    name: String(position.name ?? position.symbol ?? ''),
    lots: toNumber(position.quantity),
    avgCost: toNumber(position.averageCost),
    currentPrice: toNumber(position.currentPrice),
    marketValue: toNumber(position.currentValue),
    pnl: toNumber(position.profitLoss),
    pnlPercent: toNumber(position.profitLossPercent),
    portfolioWeight: toNumber(position.weight),
    aiScore: 0,
    risk: riskLevel(toNumber(position.risk)),
    eliteRating: String(position.eliteRating ?? ''),
    opportunityLevel: '',
    sector: String(position.sector ?? ''),
  };
}

function mapTransaction(tx: Record<string, unknown>): Transaction {
  const type = String(tx.type ?? 'BUY') as Transaction['type'];
  return {
    id: String(tx.id ?? ''),
    symbol: String(tx.symbol ?? ''),
    type,
    date: String(tx.executedAt ?? tx.createdAt ?? ''),
    lots: toNumber(tx.quantity),
    price: toNumber(tx.price),
    amount: toNumber(tx.total),
    notes: String(tx.notes ?? ''),
  };
}

function mapSummary(summary: Record<string, unknown>, performance: Record<string, unknown>): PortfolioSummary {
  return {
    totalValue: toNumber(summary.totalValue),
    totalCost: toNumber(summary.investedCapital),
    totalPnl: toNumber(summary.totalProfitLoss),
    totalPnlPercent: toNumber(summary.totalProfitLossPercent),
    dayPnl: toNumber(performance.dailyReturn),
    dayPnlPercent: toNumber(performance.dailyReturn),
    realizedPnl: 0,
    unrealizedPnl: toNumber(summary.totalProfitLoss),
    maxDrawdown: toNumber(performance.maxDrawdown),
    volatility: toNumber(performance.volatility),
    sharpeRatio: toNumber(performance.sharpeRatio),
    aiScore: 0,
    cashBalance: toNumber(summary.cash),
  };
}

function mapRisk(risk: Record<string, unknown>): RiskMetrics {
  return {
    beta: 0,
    volatility: toNumber(risk.volatility),
    sharpeRatio: toNumber(risk.sharpeRatio),
    sortinoRatio: 0,
    maxDrawdown: toNumber(risk.maxDrawdown),
    valueAtRisk: 0,
    diversificationScore: toNumber(risk.diversificationScore),
    riskScore: toNumber(risk.portfolioRisk),
  };
}

function mapAIAnalysis(risk: Record<string, unknown>, warnings: Array<Record<string, unknown>>): AIAnalysis {
  const riskScore = toNumber(risk.portfolioRisk);
  const sectorConcentration = toNumber(risk.sectorConcentration);
  const largestPosition = toNumber(risk.largestPositionPercent);
  const warningsText = warnings.map((w) => String(w.message ?? w)).filter(Boolean);
  return {
    portfolioQuality: riskScore < 30 ? 'İyi' : riskScore < 60 ? 'Orta' : 'Riskli',
    riskLevel: riskLevel(riskScore),
    concentrationRisk: largestPosition > 30 ? 'Yüksek' : largestPosition > 15 ? 'Orta' : 'Düşük',
    sectorRisk: sectorConcentration > 40 ? 'Yüksek' : sectorConcentration > 25 ? 'Orta' : 'Düşük',
    liquidity: 'Orta',
    diversification: toNumber(risk.diversificationScore) >= 60 ? 'İyi' : 'Zayıf',
    recommendations: warningsText.length ? warningsText : ['Portföy dengeli görünüyor'],
    warnings: warningsText,
  };
}

const TAB_CONFIG = [
  { key: PORTFOLIO_TAB.PORTFOLIO, label: 'Portföy Özeti', icon: Briefcase },
  { key: PORTFOLIO_TAB.ALLOCATION, label: 'Dağılım', icon: PieIcon },
  { key: PORTFOLIO_TAB.HOLDINGS, label: 'Hisseler', icon: LayoutGrid },
  { key: PORTFOLIO_TAB.TRANSACTIONS, label: 'İşlemler', icon: ArrowUpDown },
  { key: PORTFOLIO_TAB.RISK, label: 'Risk & Analiz', icon: Shield },
  { key: PORTFOLIO_TAB.TEMETTU, label: 'Temettü', icon: Coins },
  { key: 'advisor', label: 'AI Danışman', icon: Brain },
  { key: 'optimization', label: 'Optimizasyon', icon: BarChart3 },
  { key: 'intelligence', label: 'Portföy Zekâsı', icon: Sparkles },
];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<string>(PORTFOLIO_TAB.PORTFOLIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const { compactMode, toggleCompact } = usePortfolioStore();
  const [summary, setSummary] = useState<PortfolioSummary>(EMPTY_SUMMARY);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cash, setCash] = useState<CashBalance>({ available: 0, reserved: 0, total: 0 });
  const [risk, setRisk] = useState<RiskMetrics>(EMPTY_RISK);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>(EMPTY_AI);
  const [dividends, setDividends] = useState<DividendInfo>(EMPTY_DIVIDENDS);
  const [performanceHistory, setPerformanceHistory] = useState<Array<{ date: string; value: number }>>([]);
  const [optimization, setOptimization] = useState({
    diversificationScore: 0,
    sectorExposure: [] as Array<{ sector: string; current: number; suggested: number; difference: number }>,
    riskContribution: [] as Array<{ symbol: string; name: string; riskContribution: number; percentOfTotalRisk: number }>,
    suggestedAllocation: [] as Array<{ symbol: string; current: number; suggested: number; action: string }>,
    expectedReturn: 0,
    expectedVolatility: 0,
    riskReward: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const listRes = await sdkClient.portfolio();
      const portfolios = (listRes.data ?? []) as Array<Record<string, unknown>>;
      if (portfolios.length === 0) {
        setEmpty(true);
        return;
      }
      const id = String(portfolios[0].id);
      const [reportRes, positionsRes, transactionsRes] = await Promise.all([
        sdkClient.portfolioReport(id),
        sdkClient.portfolioPositions(id),
        sdkClient.portfolioTransactions(id),
      ]);
      const report = (reportRes.data ?? {}) as Record<string, unknown>;
      const summaryData = (report.summary ?? {}) as Record<string, unknown>;
      const performanceData = (report.performance ?? {}) as Record<string, unknown>;
      const riskData = (report.risk ?? {}) as Record<string, unknown>;
      const positions = (positionsRes.data ?? []) as Array<Record<string, unknown>>;
      const txList = (transactionsRes.data ?? []) as Array<Record<string, unknown>>;
      const mappedHoldings = positions.map(mapHolding);
      const mappedTransactions = txList.map(mapTransaction);
      const mappedSummary = mapSummary(summaryData, performanceData);
      const mappedRisk = mapRisk(riskData);
      const riskWarnings = (report.riskWarnings ?? []) as Array<Record<string, unknown>>;

      const startValue = toNumber(performanceData.startValue);
      const endValue = toNumber(performanceData.endValue);
      const series = startValue > 0 ? [
        { date: String(performanceData.startDate ?? ''), value: startValue },
        { date: String(performanceData.endDate ?? ''), value: endValue },
      ] : [];

      setSummary(mappedSummary);
      setHoldings(mappedHoldings);
      setTransactions(mappedTransactions);
      setCash({ available: mappedSummary.cashBalance, reserved: 0, total: mappedSummary.cashBalance });
      setRisk(mappedRisk);
      setAiAnalysis(mapAIAnalysis(riskData, riskWarnings));
      setDividends(EMPTY_DIVIDENDS);
      setPerformanceHistory(series);
      setOptimization({
        diversificationScore: mappedRisk.diversificationScore,
        sectorExposure: buildSectorAllocation(mappedHoldings).map((a) => ({
          sector: a.name,
          current: a.percent,
          suggested: Math.max(5, Math.round(a.percent / 2)),
          difference: Math.max(5, Math.round(a.percent / 2)) - a.percent,
        })),
        riskContribution: [],
        suggestedAllocation: mappedHoldings.map((h) => {
          const suggested = mappedHoldings.length ? Math.round(100 / mappedHoldings.length) : 0;
          return { symbol: h.symbol, current: h.portfolioWeight, suggested, action: h.portfolioWeight > suggested ? 'reduce' : h.portfolioWeight < suggested ? 'increase' : 'hold' };
        }),
        expectedReturn: toNumber(performanceData.percentReturn),
        expectedVolatility: toNumber(performanceData.volatility),
        riskReward: toNumber(performanceData.sharpeRatio),
      });
    } catch {
      setError('Portföy verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <SkeletonCard rows={2} className="h-24" />
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
        </div>
        <SkeletonCard rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorCard
          title="Portföy Yüklenemedi"
          message={error}
          onRetry={fetchData}
        />
      </div>
    );
  }

  const allocation = buildAllocationFromHoldings(holdings);
  const sectorAllocation = buildSectorAllocation(holdings);

  return (
    <div className="animate-fade-in space-y-4 p-4">
      <PortfolioHeader
        onAddPortfolio={() => {}}
        onAddTransaction={() => {}}
        onRefresh={fetchData}
        onExport={() => {}}
        onToggleCompact={toggleCompact}
        compactMode={compactMode}
        loading={loading}
      />

      {empty && (
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-medium">Henüz portföy oluşturulmadı</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Yeni bir portföy oluşturmak için sağ üstteki &quot;Portföy ekle&quot; butonunu kullanın.
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex overflow-x-auto border-b">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === PORTFOLIO_TAB.PORTFOLIO && (
            <div className="space-y-4">
              <PortfolioSummaryCards summary={summary} />
              <div className="grid gap-4 lg:grid-cols-2">
                <PortfolioPerformanceChart data={performanceHistory} />
                <PortfolioAllocationChart data={allocation} />
              </div>
              <PortfolioHoldingsTable holdings={holdings} onSelect={() => {}} />
            </div>
          )}

          {activeTab === PORTFOLIO_TAB.ALLOCATION && (
            <div className="grid gap-4 lg:grid-cols-2">
              <PortfolioAllocationChart data={allocation} />
              <PortfolioSectorChart data={sectorAllocation} />
            </div>
          )}

          {activeTab === PORTFOLIO_TAB.HOLDINGS && (
            <PortfolioHoldingsTable holdings={holdings} onSelect={() => {}} />
          )}

          {activeTab === PORTFOLIO_TAB.TRANSACTIONS && (
            <div className="space-y-4">
              <PortfolioTransactions transactions={transactions} />
              <PortfolioCashCard cash={cash} />
            </div>
          )}

          {activeTab === PORTFOLIO_TAB.RISK && (
            <div className="space-y-4">
              <PortfolioRiskCard risk={risk} />
              <PortfolioAIAnalysis analysis={aiAnalysis} />
            </div>
          )}

          {activeTab === PORTFOLIO_TAB.TEMETTU && (
            <PortfolioDividendCard dividends={dividends} />
          )}

          {activeTab === 'advisor' && (
            <PortfolioAdvisor />
          )}

          {activeTab === 'optimization' && (
            <PortfolioOptimization result={optimization} />
          )}

          {activeTab === 'intelligence' && (
            <PortfolioIntelligence />
          )}
        </div>
      </div>
    </div>
  );
}
