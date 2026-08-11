import { Card, Badge, Progress, SectionTitle } from '@/components/shared';
import { Layers, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface TabConfluenceProps {
  data: AnalysisResult;
}

function DirectionBadge({ direction }: { direction: string }) {
  const variant = direction === 'bullish' ? 'success' : direction === 'bearish' ? 'danger' : 'outline';
  const label = direction === 'bullish' ? 'Yükseliş' : direction === 'bearish' ? 'Düşüş' : 'Nötr';
  return <Badge variant={variant as 'success' | 'danger' | 'outline'}>{label}</Badge>;
}

function DimensionCard({ title, score, direction, confidence, factors }: {
  title: string; score: number; direction: string; confidence: number; factors: string[];
}) {
  const pct = Math.min(100, Math.max(0, score));
  const variant = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger';

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">{title}</span>
        <DirectionBadge direction={direction} />
      </div>
      <Progress value={pct} variant={variant} size="sm" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Skor: {score.toFixed(1)}</span>
        <span className="text-[10px] text-muted-foreground">Güven: {(confidence * 100).toFixed(0)}%</span>
      </div>
      {factors && factors.length > 0 && (
        <div className="space-y-1 pt-1">
          {factors.slice(0, 3).map((f, i) => (
            <p key={i} className="text-[10px] text-muted-foreground">• {f}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function TabConfluence({ data }: TabConfluenceProps) {
  const conf = data.confluence;

  return (
    <div className="space-y-4">
      <SectionTitle title="Uyum Analizi" description="Çok boyutlu uyum ve yönelim analizi" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Uyum Skoru">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary">
              <span className="text-2xl font-bold">{conf?.confluenceScore?.toFixed(0) || '0'}</span>
            </div>
            <Badge variant={conf?.confluenceScore >= 70 ? 'success' : conf?.confluenceScore >= 40 ? 'warning' : 'danger'}>
              {conf?.agreement || '-'}
            </Badge>
            <p className="text-[10px] text-muted-foreground">
              Güven: {((conf?.confidence || 0) * 100).toFixed(0)}%
            </p>
          </div>
        </Card>

        <Card title="Boyut Uyumu" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {conf?.financialAlignment && (
              <DimensionCard
                title="Finansal"
                score={conf.financialAlignment.score}
                direction={conf.financialAlignment.direction}
                confidence={conf.financialAlignment.confidence}
                factors={conf.financialAlignment.factors}
              />
            )}
            {conf?.technicalAlignment && (
              <DimensionCard
                title="Teknik"
                score={conf.technicalAlignment.score}
                direction={conf.technicalAlignment.direction}
                confidence={conf.technicalAlignment.confidence}
                factors={conf.technicalAlignment.factors}
              />
            )}
            {conf?.smartMoneyAlignment && (
              <DimensionCard
                title="Akıllı Para"
                score={conf.smartMoneyAlignment.score}
                direction={conf.smartMoneyAlignment.direction}
                confidence={conf.smartMoneyAlignment.confidence}
                factors={conf.smartMoneyAlignment.factors}
              />
            )}
            {conf?.trendAlignment && (
              <DimensionCard
                title="Trend"
                score={conf.trendAlignment.score}
                direction={conf.trendAlignment.direction}
                confidence={conf.trendAlignment.confidence}
                factors={conf.trendAlignment.factors}
              />
            )}
          </div>
        </Card>
      </div>

      <Card title="Yönelim Özeti">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Finansal', direction: conf?.financialAlignment?.direction, score: conf?.financialAlignment?.score },
            { label: 'Teknik', direction: conf?.technicalAlignment?.direction, score: conf?.technicalAlignment?.score },
            { label: 'Akıllı Para', direction: conf?.smartMoneyAlignment?.direction, score: conf?.smartMoneyAlignment?.score },
            { label: 'Trend', direction: conf?.trendAlignment?.direction, score: conf?.trendAlignment?.score },
          ].map((d) => (
            <div key={d.label} className="flex flex-col items-center gap-2 rounded-md bg-muted/50 p-3">
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
              {d.direction === 'bullish' ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : d.direction === 'bearish' ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold tabular-nums">{d.score?.toFixed(0) || '0'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
