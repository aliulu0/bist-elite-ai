import { Brain, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import type { AIAnalysis } from './portfolio-types';

interface PortfolioAIAnalysisProps {
  analysis: AIAnalysis;
}

export function PortfolioAIAnalysis({ analysis }: PortfolioAIAnalysisProps) {
  if (!analysis.portfolioQuality && analysis.recommendations.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Yapay Zeka Analizi</h3>
        <EmptyState
          title="Risk analizi için yeterli veri yok"
          description="Yeterli işlem verisi eklendikten sonra analiz burada görünecek"
          icon={<Brain className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  const metrics = [
    { label: 'Portföy Kalitesi', value: analysis.portfolioQuality },
    { label: 'Risk Seviyesi', value: analysis.riskLevel },
    { label: 'Yoğunlaşma Riski', value: analysis.concentrationRisk },
    { label: 'Sektör Riski', value: analysis.sectorRisk },
    { label: 'Likidite', value: analysis.liquidity },
    { label: 'Çeşitlendirme', value: analysis.diversification },
  ];

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Yapay Zeka Analizi</h3>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {metrics.map((m) => (
          m.value && (
            <div key={m.label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-sm font-semibold">{m.value}</p>
            </div>
          )
        ))}
      </div>

      {analysis.recommendations.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Öneriler</h4>
          <div className="space-y-1.5">
            {analysis.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-success/10 px-3 py-2 text-xs">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.warnings.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Uyarılar</h4>
          <div className="space-y-1.5">
            {analysis.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
