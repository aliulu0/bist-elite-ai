import { useState, useEffect, useCallback, useMemo } from 'react';
import { useScannerStore, filterStocks } from '@/stores/scanner-store';
import { sdkClient } from '@/lib/sdk';
import { ScannerFilters, ScannerTable, ScannerDetail, ScannerKpi, exportCsv } from '@/components/scanner';
import type { ScannerRow } from '@/components/scanner/scanner-table';
import { PageHeader, ErrorCard } from '@/components/shared';
import { RefreshCw, Download, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function ScannerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rawData, setRawData] = useState<ScannerRow[]>([]);

  const search = useScannerStore((s) => s.search);
  const setSearch = useScannerStore((s) => s.setSearch);
  const filters = useScannerStore((s) => s.filters);
  const leftPanelOpen = useScannerStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useScannerStore((s) => s.toggleLeftPanel);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [scanRes, candidateRes] = await Promise.all([
        sdkClient.scanner(),
        sdkClient.scannerCandidates().catch(() => null),
      ]);

      const candidates = candidateRes?.data?.items || [];
      const candidateMap = new Map(candidates.map((c) => [c.symbol, c]));

      const top = scanRes?.topCandidates || [];
      const items: ScannerRow[] = top.map((item) => {
        const candidate = candidateMap.get(item.symbol);
        const eliteScore = item.eliteScore || 0;
        return {
          symbol: item.symbol,
          name: '',
          sector: '',
          eliteScore,
          opportunityScore: candidate?.eliteScore || eliteScore,
          financialScore: 0,
          technicalScore: 0,
          smartMoneyScore: 0,
          totalScore: item.compositeScore || eliteScore,
          status: item.rank <= 5 ? 'TOP_CANDIDATE' : item.rank <= 20 ? 'WATCHLIST' : 'REJECTED',
          rank: item.rank,
        };
      });

      setRawData(items);
    } catch {
      setError('Tarama sonuçları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => filterStocks(rawData as unknown as Record<string, unknown>[], filters, search) as unknown as ScannerRow[], [rawData, filters, search]);

  return (
    <div>
      <PageHeader
        title="Piyasa Tarayıcı"
        description="BIST hisselerini tarayın ve fırsatları tespit edin"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
              aria-label="CSV dışa aktar"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              onClick={toggleLeftPanel}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
              aria-label="Filtre panelini aç/kapat"
            >
              {leftPanelOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
              Filtreler
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              aria-label="Tazele"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Tazele
            </button>
          </div>
        }
      />

      <ScannerKpi data={filtered} loading={loading} />

      <div className="flex gap-4">
        {leftPanelOpen && (
          <div className="hidden w-64 shrink-0 lg:block">
            <ScannerFilters />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {error ? (
            <ErrorCard message={error} onRetry={fetchData} />
          ) : (
            <ScannerTable data={filtered} loading={loading} />
          )}
        </div>

        <div className="hidden w-80 shrink-0 xl:block">
          <ScannerDetail />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground lg:hidden">
        <span>{filtered.length} hisse gösteriliyor</span>
      </div>
    </div>
  );
}
