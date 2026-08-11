import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/shared/card';
import { LoadingCard } from '@/components/shared/loading-card';
import { ErrorCard } from '@/components/shared/error-card';
import { Download, Search } from 'lucide-react';
import { sdkClient } from '@/lib/sdk';

export default function AiReportsPage() {
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<{ markdown: string } | null>(null);

  const handleGenerate = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const data = await sdkClient.aiReportMarkdown(symbol.trim().toUpperCase(), timeframe);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rapor oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report?.markdown) return;
    const blob = new Blob([report.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol.toUpperCase()}_yatirim_raporu.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Yatırım Raporları"
        description="Detaylı hisse analiz raporları oluşturun ve dışa aktarın"
      />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Rapor Ayarları</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Sembol</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="ASELS"
                  className="w-full rounded-lg border bg-background py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Zaman Dilimi</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="1d">1 Gün</option>
                <option value="1w">1 Hafta</option>
                <option value="1m">1 Ay</option>
                <option value="3m">3 Ay</option>
                <option value="6m">6 Ay</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!symbol.trim() || loading}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
            </button>
          </div>
        </Card>
        <div>
          {loading && <LoadingCard />}
          {error && <ErrorCard message={error} onRetry={handleGenerate} />}
          {report && (
            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium">{symbol} - Yatırım Raporu</h3>
                <button
                  onClick={handleExportMarkdown}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  MD Olarak İndir
                </button>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap rounded-lg bg-muted/50 p-4 font-mono text-xs leading-relaxed">
                {report.markdown}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
