import { EmptyState } from '@/components/shared';
import { ArrowUpDown } from 'lucide-react';
import type { Transaction } from './portfolio-types';
import { TRANSACTION_TYPE_LABELS } from './portfolio-types';

interface PortfolioTransactionsProps {
  transactions: Transaction[];
}

export function PortfolioTransactions({ transactions }: PortfolioTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">İşlem Geçmişi</h3>
        <EmptyState
          title="İşlem geçmişi boş"
          description="İşlem ekledikten sonra geçmişi burada görebilirsiniz"
          icon={<ArrowUpDown className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  const TypeColor: Record<string, string> = {
    BUY: 'text-success',
    SELL: 'text-destructive',
    DIVIDEND: 'text-primary',
    COMMISSION: 'text-warning',
    TAX: 'text-warning',
    TRANSFER: 'text-muted-foreground',
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">İşlem Geçmişi ({transactions.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Tarih</th>
              <th className="pb-2 font-medium">Tür</th>
              <th className="pb-2 font-medium">Hisse</th>
              <th className="pb-2 text-right font-medium">Lot</th>
              <th className="pb-2 text-right font-medium">Fiyat</th>
              <th className="pb-2 text-right font-medium">Tutar</th>
              <th className="pb-2 font-medium">Notlar</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-2">{t.date ? new Date(t.date).toLocaleDateString('tr-TR') : '-'}</td>
                <td className={`py-2 font-medium ${TypeColor[t.type] || ''}`}>
                  {TRANSACTION_TYPE_LABELS[t.type] || t.type}
                </td>
                <td className="py-2 font-medium">{t.symbol}</td>
                <td className="py-2 text-right">{t.lots}</td>
                <td className="py-2 text-right font-mono">₺{t.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="py-2 text-right font-mono">₺{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="py-2 text-muted-foreground">{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
