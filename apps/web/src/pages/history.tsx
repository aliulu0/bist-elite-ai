import { useCallback, useEffect } from 'react';
import { useHistoryStore } from '@/stores/history-store';
import { sdkClient } from '@/lib/sdk';
import { ErrorCard, LoadingOverlay } from '@/components/shared';
import {
  HistoryHeader,
  HistorySummary,
  HistoryTabs,
  HistoryStatusTable,
  HistorySymbolDetail,
  HistoryGapsPanel,
  HistoryQualityPanel,
  HistoryBackfillPanel,
} from '@/components/history';

export default function HistoryPage() {
  const activeTab = useHistoryStore((s) => s.activeTab);
  const timeframe = useHistoryStore((s) => s.timeframe);
  const report = useHistoryStore((s) => s.report);
  const selectedSymbol = useHistoryStore((s) => s.selectedSymbol);
  const symbolStatus = useHistoryStore((s) => s.symbolStatus);
  const gaps = useHistoryStore((s) => s.gaps);
  const quality = useHistoryStore((s) => s.quality);
  const backfillInfo = useHistoryStore((s) => s.backfillInfo);
  const backfillResult = useHistoryStore((s) => s.backfillResult);
  const bulkResult = useHistoryStore((s) => s.bulkResult);
  const loading = useHistoryStore((s) => s.loading);
  const detailLoading = useHistoryStore((s) => s.detailLoading);
  const error = useHistoryStore((s) => s.error);

  const setActiveTab = useHistoryStore((s) => s.setActiveTab);
  const setTimeframe = useHistoryStore((s) => s.setTimeframe);
  const setReport = useHistoryStore((s) => s.setReport);
  const setSelectedSymbol = useHistoryStore((s) => s.setSelectedSymbol);
  const setSymbolStatus = useHistoryStore((s) => s.setSymbolStatus);
  const setGaps = useHistoryStore((s) => s.setGaps);
  const setQuality = useHistoryStore((s) => s.setQuality);
  const setBackfillInfo = useHistoryStore((s) => s.setBackfillInfo);
  const setBackfillResult = useHistoryStore((s) => s.setBackfillResult);
  const setBulkResult = useHistoryStore((s) => s.setBulkResult);
  const setLoading = useHistoryStore((s) => s.setLoading);
  const setDetailLoading = useHistoryStore((s) => s.setDetailLoading);
  const setError = useHistoryStore((s) => s.setError);
  const setLastRefresh = useHistoryStore((s) => s.setLastRefresh);
  const clear = useHistoryStore((s) => s.clear);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.historyStatus(timeframe);
      setReport(res);
      setLastRefresh(new Date().toISOString());
    } catch {
      setError('Tarihsel veri durumu yüklenirken hata oluştu');
    }
  }, [timeframe, setReport, setLoading, setError, setLastRefresh]);

  const fetchSymbolDetail = useCallback(
    async (symbol: string, tf: string) => {
      setDetailLoading(true);
      try {
        const [statusRes, gapsRes, qualityRes, backfillInfoRes] = await Promise.all([
          sdkClient.historySymbolStatus(symbol, tf),
          sdkClient.historyGaps(symbol, tf),
          sdkClient.historyQuality(symbol, tf),
          sdkClient.historyBackfillStatus(symbol, tf),
        ]);
        setSymbolStatus(statusRes);
        setGaps(gapsRes);
        setQuality(qualityRes);
        setBackfillInfo(backfillInfoRes);
      } catch {
        setError('Sembol detayı yüklenirken hata oluştu');
      } finally {
        setDetailLoading(false);
      }
    },
    [setSymbolStatus, setGaps, setQuality, setBackfillInfo, setDetailLoading, setError],
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (selectedSymbol) fetchSymbolDetail(selectedSymbol, timeframe);
  }, [selectedSymbol, timeframe, fetchSymbolDetail]);

  const handleSelectSymbol = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      setActiveTab('symbol');
    },
    [setSelectedSymbol, setActiveTab],
  );

  const handleBackfillSymbol = useCallback(
    async (symbol: string, tf: string, rangeStart: string, rangeEnd: string) => {
      setLoading(true);
      setError('');
      try {
        const body: Record<string, unknown> = { timeframe: tf };
        if (rangeStart) body.from = rangeStart;
        if (rangeEnd) body.to = rangeEnd;
        const result = await sdkClient.historyBackfill(symbol, body);
        setBackfillResult(result);
        setSelectedSymbol(symbol);
        await fetchSymbolDetail(symbol, tf);
        await fetchReport();
      } catch {
        setError('Backfill başlatılamadı');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setBackfillResult, setSelectedSymbol, fetchSymbolDetail, fetchReport],
  );

  const handleBackfillBulk = useCallback(
    async (tf: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await sdkClient.historyBackfillBulk({ timeframe: tf });
        setBulkResult(res);
        await fetchReport();
      } catch {
        setError('Toplu backfill başlatılamadı');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setBulkResult, fetchReport],
  );

  const handleExport = useCallback(() => {
    const payload = {
      report,
      selectedSymbol,
      symbolStatus,
      gaps,
      quality,
      backfillInfo,
      backfillResult,
      bulkResult,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarihsel-veri-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [report, selectedSymbol, symbolStatus, gaps, quality, backfillInfo, backfillResult, bulkResult]);

  const handleClear = useCallback(() => {
    clear();
  }, [clear]);

  return (
    <div className="space-y-6">
      <HistoryHeader
        onRefresh={fetchReport}
        onExport={handleExport}
        onClear={handleClear}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        loading={loading}
        lastRefresh={useHistoryStore.getState().lastRefresh}
      />

      {error && <ErrorCard message={error} onRetry={fetchReport} />}

      <HistorySummary report={report} />
      <HistoryTabs />

      {loading && <LoadingOverlay />}

      {activeTab === 'overview' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <HistoryStatusTable report={report} selectedSymbol={selectedSymbol} onSelect={handleSelectSymbol} />
        </div>
      )}

      {activeTab === 'symbol' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <HistorySymbolDetail status={symbolStatus} loading={detailLoading} />
          </div>
          <HistoryQualityPanel quality={quality} />
          <HistoryGapsPanel gaps={gaps} />
        </div>
      )}

      {activeTab === 'backfill' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <HistoryBackfillPanel
            selectedSymbol={selectedSymbol}
            timeframe={timeframe}
            backfillInfo={backfillInfo}
            backfillResult={backfillResult}
            bulkResult={bulkResult}
            running={loading}
            onBackfillSymbol={handleBackfillSymbol}
            onBackfillBulk={handleBackfillBulk}
          />
        </div>
      )}
    </div>
  );
}
