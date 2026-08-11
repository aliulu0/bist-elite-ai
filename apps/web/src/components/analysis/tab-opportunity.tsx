import { Card, Badge, Progress, SectionTitle } from '@/components/shared';
import { Target, AlertTriangle, CheckCircle, Zap, TrendingUp } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface TabOpportunityProps {
  data: AnalysisResult;
}

export function TabOpportunity({ data }: TabOpportunityProps) {
  const opp = data.opportunity;

  return (
    <div className="space-y-4">
      <SectionTitle title="Fırsat Analizi" description="Fırsat değerlendirmesi ve risk faktörleri" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Fırsat Skoru">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary">
              <span className="text-2xl font-bold">{opp?.opportunityScore?.toFixed(0) || '0'}</span>
            </div>
            <Badge variant={opp?.opportunityLevel === 'VERY_HIGH' || opp?.opportunityLevel === 'HIGH' ? 'success' : opp?.opportunityLevel === 'MEDIUM' ? 'warning' : 'outline'}>
              {opp?.opportunityLevel || '-'}
            </Badge>
            <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground">Güven: {((opp?.confidence || 0) * 100).toFixed(0)}%</p>
              {opp?.earlyOpportunity && (
                <Badge variant="info">Erken Fırsat</Badge>
              )}
            </div>
          </div>
        </Card>

        <Card title="Fırsat Değerlendirmesi" className="lg:col-span-2">
          <div className="space-y-4">
            {opp?.reasons && opp.reasons.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-2">Nedenler</p>
                <div className="space-y-2">
                  {opp.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Target className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <span className="text-xs text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {opp?.strengths && opp.strengths.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-success mb-2">Güçlü Yönler</p>
                <div className="space-y-2">
                  {opp.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                      <span className="text-xs text-muted-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {opp?.riskFactors && opp.riskFactors.length > 0 && (
        <Card title="Risk Faktörleri">
          <div className="space-y-2">
            {opp.riskFactors.map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                <span className="text-xs text-muted-foreground">{r}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Skor Karşılaştırması">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Fırsat', score: opp?.opportunityScore || 0 },
            { label: 'Elite', score: data.eliteScore?.eliteScore || 0 },
            { label: 'Finansal', score: data.financialScore?.score || 0 },
            { label: 'Teknik', score: data.technicalScore?.score || 0 },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 rounded-md bg-muted/50 p-3">
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
              <span className="text-lg font-bold tabular-nums">{item.score.toFixed(0)}</span>
              <Progress
                value={item.score}
                variant={item.score >= 70 ? 'success' : item.score >= 40 ? 'warning' : 'danger'}
                size="sm"
                className="w-full"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
