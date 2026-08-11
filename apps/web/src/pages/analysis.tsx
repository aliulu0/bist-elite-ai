import { useState, useCallback } from 'react';
import { PageHeader, LoadingCard, ErrorCard, EmptyState } from '@/components/shared';
import { sdkClient } from '@/lib/sdk';
import { useAnalysisStore } from '@/stores/analysis-store';
import {
  AnalysisHeader,
  AnalysisSummary,
  AnalysisTabs,
  TabGeneral,
  TabFinancial,
  TabTechnical,
  TabSmartMoney,
  TabConfluence,
  TabOpportunity,
  TabWorkflow,
  TabBacktest,
} from '@/components/analysis';
import type { AnalysisResult } from '@/components/analysis';
import { Search, TrendingUp } from 'lucide-react';

export default function AnalysisPage() {
  const { symbol, timeframe, activeTab, searchInput, setSymbol, setTimeframe, setActiveTab, setSearchInput } = useAnalysisStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAnalysis = useCallback(async (sym: string, tf: string) => {
    if (!sym.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.analysis(sym.trim().toUpperCase(), tf);
      setResult(res as unknown as AnalysisResult);
      setSymbol(sym.trim().toUpperCase());
    } catch {
      setError(`${sym.toUpperCase()} analiz edilirken hata oluştu`);
    } finally {
      setLoading(false);
    }
  }, [setSymbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      runAnalysis(searchInput, timeframe);
    }
  };

  const handleRefresh = () => {
    if (symbol) {
      runAnalysis(symbol, timeframe);
    }
  };

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    if (symbol) {
      runAnalysis(symbol, tf);
    }
  };

  return (
    <div>
      <PageHeader
        title="Hisse Analiz"
        description="Kapsamlı hisse analizi ve değerlendirme workspace'i"
        actions={
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Hisse kodu (ör: GARAN)"
                className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Hisse kodu"
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim() || loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Analiz Et
            </button>
          </form>
        }
      />

      {loading && !result && <LoadingCard title="Analiz çalıştırılıyor..." description="Veriler alınıyor ve analiz ediliyor" />}

      {error && !result && <ErrorCard message={error} onRetry={() => runAnalysis(searchInput || symbol, timeframe)} />}

      {!loading && !error && !result && (
        <EmptyState
          title="Hisse analizi başlatın"
          description="Yukarıdaki alana bir hisse kodu girerek kapsamlı analiz başlatın"
          icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
        />
      )}

      {result && (
        <div className="space-y-4">
          {loading && (
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Güncelleniyor...
            </div>
          )}

          <AnalysisHeader
            data={result}
            timeframe={timeframe}
            onTimeframeChange={handleTimeframeChange}
            onRefresh={handleRefresh}
            loading={loading}
          />

          <AnalysisSummary data={result} />

          <AnalysisTabs activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'genel' && <TabGeneral data={result} />}
            {activeTab === 'finansal' && <TabFinancial data={result} />}
            {activeTab === 'teknik' && <TabTechnical data={result} />}
            {activeTab === 'smart-money' && <TabSmartMoney data={result} />}
            {activeTab === 'confluence' && <TabConfluence data={result} />}
            {activeTab === 'opportunity' && <TabOpportunity data={result} />}
            {activeTab === 'workflow' && <TabWorkflow data={result} />}
            {activeTab === 'backtest' && <TabBacktest data={result} />}
          </AnalysisTabs>
        </div>
      )}
    </div>
  );
}
