import { Card, Badge, Progress, SectionTitle } from '@/components/shared';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface TabGeneralProps {
  data: AnalysisResult;
}

function ScoreSection({ title, score, grade }: { title: string; score: number; grade?: string }) {
  const pct = Math.min(100, Math.max(0, score));
  const variant = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{title}</span>
        <div className="flex items-center gap-2">
          {grade && <Badge variant={variant as 'success' | 'warning' | 'danger'}>{grade}</Badge>}
          <span className="text-sm font-bold tabular-nums">{pct.toFixed(1)}</span>
        </div>
      </div>
      <Progress value={pct} variant={variant} size="sm" />
    </div>
  );
}

function BreakdownBar({ label, score, weight, contribution }: { label: string; score: number; weight: number; contribution: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label} ({weight}%)</span>
        <span className="font-semibold tabular-nums">{score.toFixed(1)} → {contribution.toFixed(1)}</span>
      </div>
      <Progress value={score} variant={score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger'} size="sm" />
    </div>
  );
}

export function TabGeneral({ data }: TabGeneralProps) {
  const elite = data.eliteScore;
  const summary = data.technicalSummary;
  const financial = data.financialSummary;

  return (
    <div className="space-y-4">
      <SectionTitle title="Genel Bakış" description="Tüm analiz boyutlarının özeti" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Elite Skor Dağılımı">
          <div className="space-y-3">
            <ScoreSection title="Elite Skor" score={elite?.eliteScore || 0} grade={elite?.rating} />
            {elite?.breakdown && (
              <div className="space-y-2 pt-2">
                <BreakdownBar label="Finansal" score={elite.breakdown.financial.score} weight={elite.breakdown.financial.weight} contribution={elite.breakdown.financial.contribution} />
                <BreakdownBar label="Teknik" score={elite.breakdown.technical.score} weight={elite.breakdown.technical.weight} contribution={elite.breakdown.technical.contribution} />
                <BreakdownBar label="Fırsat" score={elite.breakdown.opportunity.score} weight={elite.breakdown.opportunity.weight} contribution={elite.breakdown.opportunity.contribution} />
                <BreakdownBar label="Uyum" score={elite.breakdown.confluence.score} weight={elite.breakdown.confluence.weight} contribution={elite.breakdown.confluence.contribution} />
                <BreakdownBar label="Aday" score={elite.breakdown.candidate.score} weight={elite.breakdown.candidate.weight} contribution={elite.breakdown.candidate.contribution} />
              </div>
            )}
          </div>
        </Card>

        <Card title="Özet">
          <div className="space-y-3">
            {elite?.summary && (
              <p className="text-xs text-muted-foreground leading-relaxed">{elite.summary}</p>
            )}
            {financial?.overallOpinion && (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">Finansal Görüş</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{financial.overallOpinion}</p>
              </div>
            )}
            {summary?.overallOpinion && (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">Teknik Görüş</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{summary.overallOpinion}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Güçlü Yönler">
          <div className="space-y-2">
            {[...(financial?.strengths || []), ...(summary?.strengths || [])].slice(0, 6).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                <span className="text-xs text-muted-foreground">{s}</span>
              </div>
            ))}
            {(!financial?.strengths?.length && !summary?.strengths?.length) && (
              <p className="text-xs text-muted-foreground">Güçlü yön bulunamadı</p>
            )}
          </div>
        </Card>

        <Card title="Zayıflıklar">
          <div className="space-y-2">
            {[...(financial?.weaknesses || []), ...(summary?.weaknesses || [])].slice(0, 6).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                <span className="text-xs text-muted-foreground">{s}</span>
              </div>
            ))}
            {(!financial?.weaknesses?.length && !summary?.weaknesses?.length) && (
              <p className="text-xs text-muted-foreground">Zayıflık bulunamadı</p>
            )}
          </div>
        </Card>
      </div>

      <Card title="Pipeline Adımları">
        <div className="space-y-2">
          {data.pipelineSteps?.map((step, i) => (
            <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
              <span className="text-xs font-medium">{step.step}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tabular-nums text-muted-foreground">{step.durationMs}ms</span>
                <Badge variant={step.success ? 'success' : 'danger'}>{step.success ? 'Başarılı' : 'Başarısız'}</Badge>
              </div>
            </div>
          ))}
          {(!data.pipelineSteps || data.pipelineSteps.length === 0) && (
            <p className="text-xs text-muted-foreground">Pipeline adımı bulunamadı</p>
          )}
        </div>
      </Card>
    </div>
  );
}
