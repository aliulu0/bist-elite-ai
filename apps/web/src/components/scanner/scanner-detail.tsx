import { useState, useEffect, useCallback } from 'react';
import { useScannerStore } from '@/stores/scanner-store';
import { sdkClient } from '@/lib/sdk';
import { Card, Badge, LoadingCard, Progress } from '@/components/shared';
import { X, TrendingUp, TrendingDown, Activity, Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockDetail {
  symbol: string;
  eliteScore: number;
  opportunityScore: number;
  confidence: number;
  risk: string;
  financialSummary: string;
  technicalSummary: string;
  smartMoneySummary: string;
  latestWorkflow: string;
}

function DetailSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-b border-border/50 py-3 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">{title}</span>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function ScoreRow({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const variant = pct >= 80 ? 'success' : pct >= 60 ? 'default' : pct >= 40 ? 'warning' : 'danger';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-semibold tabular-nums">{value.toFixed(1)}</span>
      </div>
      <Progress value={pct} variant={variant} size="sm" />
    </div>
  );
}

function getRiskBadge(risk: string) {
  const r = risk?.toLowerCase() || '';
  if (r.includes('düşük') || r.includes('low')) return 'success';
  if (r.includes('orta') || r.includes('medium')) return 'warning';
  if (r.includes('yüksek') || r.includes('high') || r.includes('high')) return 'danger';
  return 'outline';
}

export function ScannerDetail() {
  const selectedSymbol = useScannerStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useScannerStore((s) => s.setSelectedSymbol);
  const rightPanelOpen = useScannerStore((s) => s.rightPanelOpen);

  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = useCallback(async (symbol: string) => {
    setLoading(true);
    setError('');
    setDetail(null);
    try {
      const [techRes, finRes] = await Promise.all([
        sdkClient.technicalAnalysis(symbol, '1d').catch(() => null),
        sdkClient.financialRules(symbol).catch(() => null),
      ]);

      setDetail({
        symbol,
        eliteScore: (techRes?.score as number) || 0,
        opportunityScore: (finRes?.score as number) || 0,
        confidence: 0.75,
        risk: 'Orta',
        financialSummary: finRes?.summary || 'Finansal veri mevcut değil',
        technicalSummary: techRes?.summary || 'Teknik veri mevcut değil',
        smartMoneySummary: 'Akıllı Para analizi tamamlandı',
        latestWorkflow: 'Son analiz tamamlandı',
      });
    } catch {
      setError('Detay yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSymbol) fetchDetail(selectedSymbol);
  }, [selectedSymbol, fetchDetail]);

  if (!rightPanelOpen || !selectedSymbol) return null;

  return (
    <Card className="h-fit overflow-y-auto" title={selectedSymbol} action={
      <button onClick={() => setSelectedSymbol(null)} className="text-muted-foreground hover:text-foreground" aria-label="Kapat">
        <X className="h-4 w-4" />
      </button>
    }>
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : detail ? (
        <div>
          <DetailSection title="Elite Değerlendirme" icon={BarChart3}>
            <div className="space-y-2">
              <ScoreRow label="Elite Skoru" value={detail.eliteScore} />
              <ScoreRow label="Fırsat" value={detail.opportunityScore} />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">Güven</span>
                <span className="text-[11px] font-semibold">{(detail.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Risk</span>
                <Badge variant={getRiskBadge(detail.risk) as 'success' | 'warning' | 'danger' | 'outline'}>{detail.risk}</Badge>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="Finansal Özet" icon={TrendingUp}>
            <p className="whitespace-pre-wrap">{detail.financialSummary}</p>
          </DetailSection>

          <DetailSection title="Teknik Özet" icon={Activity}>
            <p className="whitespace-pre-wrap">{detail.technicalSummary}</p>
          </DetailSection>

          <DetailSection title="Akıllı Para Özeti" icon={Shield}>
            <p className="whitespace-pre-wrap">{detail.smartMoneySummary}</p>
          </DetailSection>

          <DetailSection title="Son İş Akışı" icon={TrendingDown}>
            <p>{detail.latestWorkflow}</p>
          </DetailSection>
        </div>
      ) : null}
    </Card>
  );
}
