import { Card, Badge, Progress, SectionTitle } from '@/components/shared';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface TabFinancialProps {
  data: AnalysisResult;
}

function RuleRow({ name, status, message }: { name: string; status: string; message: string }) {
  const variant = status === 'PASS' ? 'success' : status === 'FAIL' ? 'danger' : status === 'WARNING' ? 'warning' : 'outline';
  const label = status === 'PASS' ? 'Geçti' : status === 'FAIL' ? 'Başarısız' : status === 'WARNING' ? 'Uyarı' : 'Mevcut Değil';
  const Icon = status === 'PASS' ? CheckCircle : status === 'FAIL' ? XCircle : status === 'WARNING' ? AlertTriangle : null;

  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className={`h-3 w-3 shrink-0 ${status === 'PASS' ? 'text-success' : status === 'FAIL' ? 'text-destructive' : 'text-warning'}`} />}
        <span className="text-xs font-medium truncate">{name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {message && <span className="text-[10px] text-muted-foreground max-w-[200px] truncate hidden sm:block">{message}</span>}
        <Badge variant={variant as 'success' | 'danger' | 'warning' | 'outline'}>{label}</Badge>
      </div>
    </div>
  );
}

export function TabFinancial({ data }: TabFinancialProps) {
  const rules = data.financialRules?.rules || [];
  const score = data.financialScore;
  const summary = data.financialSummary;

  return (
    <div className="space-y-4">
      <SectionTitle title="Finansal Analiz" description="Finansal kurallar ve skor değerlendirmesi" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Finansal Skor">
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

        <Card title="Finansal Özet" className="lg:col-span-2">
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

      <Card title={`Finansal Kurallar (${rules.length})`}>
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <RuleRow key={i} name={rule.name} status={rule.status} message={rule.message} />
          ))}
          {rules.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Finansal kural bulunamadı</p>
          )}
        </div>
      </Card>

      {summary?.risks && summary.risks.length > 0 && (
        <Card title="Riskler">
          <div className="space-y-2">
            {summary.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                <span className="text-xs text-muted-foreground">{r}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
