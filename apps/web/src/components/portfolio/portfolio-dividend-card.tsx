import { Coins } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import type { DividendInfo } from './portfolio-types';
import { formatCurrency } from '@/lib/utils';

interface PortfolioDividendCardProps {
  dividends: DividendInfo;
}

export function PortfolioDividendCard({ dividends }: PortfolioDividendCardProps) {
  const hasData = dividends.totalReceived > 0 || dividends.history.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Temettü Bilgisi</h3>
        <EmptyState
          title="Temettü verisi yok"
          description="Temettü bilgileri burada görünecek"
          icon={<Coins className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Coins className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Temettü Bilgisi</h3>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Toplam Alınan</p>
          <p className="text-sm font-bold font-mono text-success">{formatCurrency(dividends.totalReceived)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Yıllık Beklenen</p>
          <p className="text-sm font-bold font-mono">{formatCurrency(dividends.expectedAnnual)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Verim Oranı</p>
          <p className="text-sm font-bold font-mono">{dividends.yieldPercent.toFixed(2)}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Son Ödeme</p>
          <p className="text-sm font-mono text-muted-foreground">{dividends.lastPaymentDate || '-'}</p>
        </div>
      </div>

      {dividends.history.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Ödeme Geçmişi</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Hisse</th>
                  <th className="pb-2 font-medium">Tarih</th>
                  <th className="pb-2 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {dividends.history.map((h, i) => (
                  <tr key={`${h.symbol}-${i}`} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 font-medium">{h.symbol}</td>
                    <td className="py-2 text-muted-foreground">{h.date}</td>
                    <td className="py-2 text-right font-mono text-success">{formatCurrency(h.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
