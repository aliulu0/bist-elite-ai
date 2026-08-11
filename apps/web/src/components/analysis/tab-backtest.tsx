import { Card, Badge, SectionTitle, EmptyState, Progress } from '@/components/shared';
import { BarChart3, TrendingUp, AlertTriangle, Scale } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface TabBacktestProps {
  data: AnalysisResult;
}

export function TabBacktest({ data }: TabBacktestProps) {
  return (
    <div className="space-y-4">
      <SectionTitle title="Backtest Analizi" description="Geçmiş performans ve geriye dönük test sonuçları" />

      <Card>
        <EmptyState
          title="Backtest verisi mevcut değil"
          description="Bu hisse için henüz backtest çalıştırılmamış. İş Akışı sekmesinden backtest iş akışı başlatabilirsiniz."
          icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
        />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Kazanma Oranı', value: '-', icon: TrendingUp },
          { label: 'Sharpe', value: '-', icon: Scale },
          { label: 'Maks. Düşüş', value: '-', icon: AlertTriangle },
          { label: 'Kâr Faktörü', value: '-', icon: BarChart3 },
        ].map((item) => (
          <Card key={item.label} className="p-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold tabular-nums">{item.value}</p>
              </div>
              <div className="rounded-md bg-muted p-1.5">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Geçmiş Performans">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Performans grafiği backtest çalıştırıldığında burada görüntülenecek</p>
        </div>
      </Card>
    </div>
  );
}
