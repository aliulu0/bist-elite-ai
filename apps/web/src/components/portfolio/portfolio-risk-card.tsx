import { Shield, AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import type { RiskMetrics } from './portfolio-types';

interface PortfolioRiskCardProps {
  risk: RiskMetrics;
}

export function PortfolioRiskCard({ risk }: PortfolioRiskCardProps) {
  if (risk.beta === 0 && risk.volatility === 0 && risk.riskScore === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Risk Metrikleri</h3>
        <EmptyState
          title="Risk analizi için yeterli veri yok"
          description="Yeterli veri eklendikten sonra risk metrikleri burada görünecek"
          icon={<Shield className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  const metrics = [
    { label: 'Beta', value: risk.beta.toFixed(2) },
    { label: 'Volatilite', value: `${(risk.volatility * 100).toFixed(2)}%` },
    { label: 'Sharpe Oranı', value: risk.sharpeRatio.toFixed(2) },
    { label: 'Sortino Oranı', value: risk.sortinoRatio.toFixed(2) },
    { label: 'Maks. Drawdown', value: `${(risk.maxDrawdown * 100).toFixed(2)}%` },
    { label: 'Value at Risk', value: `₺${risk.valueAtRisk.toLocaleString('tr-TR')}` },
    { label: 'Çeşitlendirme Skoru', value: `${risk.diversificationScore}/100` },
    { label: 'Risk Skoru', value: `${risk.riskScore}/100` },
  ];

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Risk Metrikleri</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-sm font-bold font-mono">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
