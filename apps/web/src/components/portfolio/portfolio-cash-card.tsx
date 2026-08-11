import { Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { CashBalance } from './portfolio-types';

interface PortfolioCashCardProps {
  cash: CashBalance;
}

export function PortfolioCashCard({ cash }: PortfolioCashCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Banknote className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Nakit Durumu</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Kullanılabilir</span>
          <span className="text-sm font-bold font-mono">{formatCurrency(cash.available)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Rezerv</span>
          <span className="text-sm font-bold font-mono">{formatCurrency(cash.reserved)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Toplam</span>
          <span className="text-sm font-bold font-mono">{formatCurrency(cash.total)}</span>
        </div>
      </div>
    </div>
  );
}
