import { Card, Badge, Progress, SectionTitle } from '@/components/shared';
import { Shield, Eye, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface TabSmartMoneyProps {
  data: AnalysisResult;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, score * 100));
  const variant = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-semibold tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      <Progress value={pct} variant={variant} size="sm" />
    </div>
  );
}

export function TabSmartMoney({ data }: TabSmartMoneyProps) {
  const sm = data.smartMoney;

  const activityLabel = sm?.institutionalActivity === 'accumulating' ? 'Toparlama'
    : sm?.institutionalActivity === 'distributing' ? 'Dağıtım'
    : 'Nötr';

  const activityVariant = sm?.institutionalActivity === 'accumulating' ? 'success'
    : sm?.institutionalActivity === 'distributing' ? 'danger'
    : 'outline';

  const trendLabel = sm?.trendAlignment === 'bullish' ? 'Yükseliş'
    : sm?.trendAlignment === 'bearish' ? 'Düşüş'
    : 'Nötr';

  const trendVariant = sm?.trendAlignment === 'bullish' ? 'success'
    : sm?.trendAlignment === 'bearish' ? 'danger'
    : 'outline';

  return (
    <div className="space-y-4">
      <SectionTitle title="Akıllı Para Analizi" description="Kurumsal para akışı ve birikim dağılım analizi" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Birikim Dağılım">
          <div className="space-y-3 py-2">
            <ScoreBar label="Birikim Skoru" score={sm?.accumulationScore || 0} />
            <ScoreBar label="Dağıtım Skoru" score={sm?.distributionScore || 0} />
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground">Kurumsal Katılım</span>
              <Badge variant={activityVariant as 'success' | 'danger' | 'outline'}>{activityLabel}</Badge>
            </div>
          </div>
        </Card>

        <Card title="Yönelim">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary">
              {sm?.trendAlignment === 'bullish' ? (
                <TrendingUp className="h-8 w-8 text-success" />
              ) : sm?.trendAlignment === 'bearish' ? (
                <TrendingUp className="h-8 w-8 rotate-180 text-destructive" />
              ) : (
                <Activity className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <Badge variant={trendVariant as 'success' | 'danger' | 'outline'}>{trendLabel}</Badge>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Güven: {((sm?.smartMoneyConfidence || 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>

        <Card title="Geçerlilik">
          <div className="flex flex-col items-center gap-3 py-4">
            <Badge variant={sm?.isValid ? 'success' : 'danger'}>
              {sm?.isValid ? 'Geçerli' : 'Geçersiz'}
            </Badge>
            <p className="text-xs text-muted-foreground text-center">
              {sm?.isValid ? 'Akıllı Para analizi başarıyla tamamlandı' : 'Akıllı Para analizi tamamlanamadı'}
            </p>
          </div>
        </Card>
      </div>

      {sm?.signals && sm.signals.length > 0 && (
        <Card title="Sinyaller">
          <div className="space-y-2">
            {sm.signals.map((signal, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="h-3 w-3 shrink-0 text-primary" />
                  <span className="text-xs font-medium">{signal.type}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground max-w-[200px] truncate hidden sm:block">{signal.description}</span>
                  <span className="text-[10px] font-semibold tabular-nums">{(signal.strength * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
