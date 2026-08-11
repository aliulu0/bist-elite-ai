import { Card, Badge, Progress, SectionTitle } from '@/components/shared';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface TabTechnicalProps {
  data: AnalysisResult;
}

function RuleRow({ rule, category, status, description }: { rule: string; category: string; status: string; description: string }) {
  const variant = status === 'PASS' ? 'success' : status === 'FAIL' ? 'danger' : status === 'WARNING' ? 'warning' : 'outline';
  const label = status === 'PASS' ? 'Geçti' : status === 'FAIL' ? 'Başarısız' : status === 'WARNING' ? 'Uyarı' : 'Yok';
  const Icon = status === 'PASS' ? CheckCircle : status === 'FAIL' ? XCircle : status === 'WARNING' ? AlertTriangle : null;

  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className={`h-3 w-3 shrink-0 ${status === 'PASS' ? 'text-success' : status === 'FAIL' ? 'text-destructive' : 'text-warning'}`} />}
        <div className="min-w-0">
          <span className="text-xs font-medium">{rule}</span>
          {category && <span className="ml-1.5 text-[10px] text-muted-foreground">({category})</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {description && <span className="text-[10px] text-muted-foreground max-w-[200px] truncate hidden sm:block">{description}</span>}
        <Badge variant={variant as 'success' | 'danger' | 'warning' | 'outline'}>{label}</Badge>
      </div>
    </div>
  );
}

export function TabTechnical({ data }: TabTechnicalProps) {
  const rules = data.technicalRules?.rules || [];
  const score = data.technicalScore;
  const summary = data.technicalSummary;

  return (
    <div className="space-y-4">
      <SectionTitle title="Teknik Analiz" description="Teknik kurallar, göstergeler ve skor" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Teknik Skor">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary">
              <span className="text-2xl font-bold">{score?.score?.toFixed(0) || '0'}</span>
            </div>
            {score?.grade && (
              <Badge variant={score.score >= 70 ? 'success' : score.score >= 40 ? 'warning' : 'danger'}>
                {score.grade}
              </Badge>
            )}
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Güven: {((score?.confidence || 0) * 100).toFixed(0)}%</p>
            </div>
          </div>
        </Card>

        <Card title="Teknik Özet" className="lg:col-span-2">
          <div className="space-y-3">
            {summary?.summary && (
              <p className="text-xs text-muted-foreground leading-relaxed">{summary.summary}</p>
            )}
            {summary?.overallOpinion && (
              <p className="text-xs text-muted-foreground leading-relaxed">{summary.overallOpinion}</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {summary?.strengths && summary.strengths.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-success">Güçlü Yönler</p>
                  {summary.strengths.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle className="mt-0.5 h-2.5 w-2.5 shrink-0 text-success" />
                      <span className="text-[11px] text-muted-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {summary?.weaknesses && summary.weaknesses.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-warning">Zayıflıklar</p>
                  {summary.weaknesses.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-2.5 w-2.5 shrink-0 text-warning" />
                      <span className="text-[11px] text-muted-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {score?.ruleBreakdown && score.ruleBreakdown.length > 0 && (
        <Card title="Kural Katkıları">
          <div className="space-y-2">
            {score.ruleBreakdown.slice(0, 10).map((rb, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="text-xs font-medium">{rb.rule}</span>
                  <span className="text-[10px] text-muted-foreground">({rb.category})</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-muted-foreground">Ağırlık: {rb.weight}</span>
                  <span className="text-[10px] font-semibold tabular-nums">{rb.contribution.toFixed(1)}</span>
                  <Badge variant={rb.status === 'PASS' ? 'success' : rb.status === 'FAIL' ? 'danger' : 'warning'}>
                    {rb.status === 'PASS' ? 'G' : rb.status === 'FAIL' ? 'B' : 'U'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title={`Teknik Kurallar (${rules.length})`}>
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <RuleRow key={i} rule={rule.rule} category={rule.category} status={rule.status} description={rule.description} />
          ))}
          {rules.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Teknik kural bulunamadı</p>
          )}
        </div>
      </Card>

      {summary?.recommendations && summary.recommendations.length > 0 && (
        <Card title="Öneriler">
          <div className="space-y-2">
            {summary.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span className="text-xs text-muted-foreground">{r}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
