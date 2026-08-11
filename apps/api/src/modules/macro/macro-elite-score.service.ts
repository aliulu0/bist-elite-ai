import { Injectable, Logger } from '@nestjs/common';
import { MacroScoreEngine } from './engines/macro-score.engine';
import { MacroDataService } from './macro-data.service';
import { TCMBDecisionStoreService } from './tcmb-decision-store.service';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import {
  MacroEliteComponentScore,
  MacroEliteResult,
  MacroObservability,
  MacroRecommendation,
  MacroRecommendationAction,
  MacroRiskAssessment,
  MacroTrend,
  MacroTrendResult,
  ProviderObservability,
  TCMBDecisionRecord,
} from './macro-elite.types';
import { TCMBDecisionAnalysis, TCMBSentiment } from './engines/tcmb-decision-analyzer';
import { MacroDataPoint, MacroScoreResult } from './macro.types';

const DECISION_SENTIMENT_DELTA: Record<TCMBSentiment, number> = {
  hawkish: -8,
  hawkish_leaning: -4,
  neutral: 0,
  dovish_leaning: 4,
  dovish: 8,
};

@Injectable()
export class MacroEliteScoreService {
  private readonly logger = new Logger(MacroEliteScoreService.name);
  private previousResult: MacroEliteResult | null = null;

  constructor(
    private readonly scoreEngine: MacroScoreEngine,
    private readonly dataService: MacroDataService,
    private readonly decisionStore: TCMBDecisionStoreService,
    private readonly orchestrator: MarketDataOrchestrator,
  ) {}

  async calculate(): Promise<MacroEliteResult> {
    const data = await this.dataService.fetchAll();
    const decision = this.decisionStore.list(1)[0] ?? null;

    const base = this.scoreEngine.calculate(data.points);
    const decisionDelta = this.decisionAdjustment(decision?.analysis ?? null);
    const yieldDelta = this.yieldCurveAdjustment(data.points);

    const eliteScore = Math.round(
      Math.max(0, Math.min(100, base.macroScore + decisionDelta + yieldDelta)),
    );
    const risk = this.determineRisk(eliteScore, data.points, decision);

    const result: MacroEliteResult = {
      eliteScore,
      confidence: this.computeConfidence(base.confidence, decision),
      trend: this.determineTrend(eliteScore, decision),
      risk,
      recommendation: this.determineRecommendation(eliteScore, risk),
      components: this.buildComponents(base, decisionDelta, yieldDelta, decision),
      decision,
      calculatedAt: new Date().toISOString(),
    };

    this.previousResult = result;
    return result;
  }

  async getTrend(): Promise<MacroTrendResult> {
    const previous = this.previousResult;
    const result = await this.calculate();
    return {
      trend: result.trend,
      change: previous ? Math.round((result.eliteScore - previous.eliteScore) * 10) / 10 : 0,
      currentScore: result.eliteScore,
      previousScore: previous?.eliteScore ?? null,
      drivers: result.recommendation.reasons,
      timestamp: result.calculatedAt,
    };
  }

  async getObservability(): Promise<MacroObservability> {
    const result = await this.calculate();
    const providerStatus = await this.orchestrator.getProviderStatus();
    const latestDecision = result.decision;
    const decisionAge = latestDecision
      ? Date.now() - new Date(latestDecision.storedAt).getTime()
      : null;

    const providers: ProviderObservability[] = providerStatus.map((s) => ({
      name: s.name,
      connected: s.connected,
      enabled: s.enabled,
      priority: s.priority,
      circuitState: s.circuitState,
      lastSuccessAgeMs: s.lastSuccessTime ? Date.now() - s.lastSuccessTime : null,
      lastHealthCheck: s.lastHealthCheck,
      totalRequests: s.totalRequests,
      successfulRequests: s.successfulRequests,
      failedRequests: s.failedRequests,
      avgLatencyMs: s.avgLatencyMs,
    }));

    return {
      macroScore: result.eliteScore,
      macroConfidence: result.confidence,
      decision: {
        ageHours: decisionAge === null ? null : Math.round((decisionAge / 3600000) * 10) / 10,
        source: latestDecision ? 'tcmb-decision-analyzer' : null,
        meetingDate: latestDecision?.meetingDate ?? null,
        sentiment: latestDecision?.analysis.sentiment ?? null,
      },
      providers,
      lastUpdate: result.calculatedAt,
    };
  }

  private decisionAdjustment(analysis: TCMBDecisionAnalysis | null): number {
    if (!analysis) return 0;
    const baseDelta = DECISION_SENTIMENT_DELTA[analysis.sentiment];
    const scale = 0.5 + analysis.confidence / 200;
    return Math.round(baseDelta * scale * 10) / 10;
  }

  private yieldCurveAdjustment(points: MacroDataPoint[]): number {
    const us10y = points.find((p) => p.source === 'us10y' && p.status === 'fetched')?.value;
    const us2y = points.find((p) => p.source === 'us2y' && p.status === 'fetched')?.value;
    if (us10y === undefined || us2y === undefined) return 0;
    const curve = us10y - us2y;
    if (curve < -0.5) return -5;
    if (curve < 0) return -2;
    if (curve > 1.5) return 3;
    return 0;
  }

  private computeConfidence(dataConfidence: number, decision: TCMBDecisionRecord | null): number {
    if (!decision) return Math.round(dataConfidence * 0.85);
    return Math.round(0.7 * dataConfidence + 0.3 * decision.analysis.confidence);
  }

  private determineTrend(eliteScore: number, decision: TCMBDecisionRecord | null): MacroTrend {
    if (this.previousResult) {
      const delta = eliteScore - this.previousResult.eliteScore;
      if (delta >= 3) return 'improving';
      if (delta <= -3) return 'deteriorating';
    }
    if (decision) {
      if (decision.analysis.sentiment === 'hawkish' || decision.analysis.sentiment === 'hawkish_leaning') {
        return 'deteriorating';
      }
      if (decision.analysis.sentiment === 'dovish' || decision.analysis.sentiment === 'dovish_leaning') {
        return 'improving';
      }
    }
    return 'stable';
  }

  private determineRisk(
    eliteScore: number,
    points: MacroDataPoint[],
    decision: TCMBDecisionRecord | null,
  ): MacroRiskAssessment {
    const vix = points.find((p) => p.source === 'vix' && p.status === 'fetched')?.value;
    const cds = points.find((p) => p.source === 'turkey_cds' && p.status === 'fetched')?.value;
    const drivers: string[] = [];

    if (vix !== undefined && vix >= 40) drivers.push(`VIX at ${vix}`);
    if (cds !== undefined && cds >= 500) drivers.push(`Turkey CDS at ${cds}bps`);
    if (eliteScore < 40) drivers.push(`Macro elite score ${eliteScore}`);
    if (decision) drivers.push(`TCMB sentiment: ${decision.analysis.sentiment}`);

    let level: MacroRiskAssessment['level'] = 'moderate';
    if (vix !== undefined && vix >= 40) level = 'extreme';
    else if (cds !== undefined && cds >= 500) level = 'extreme';
    else if (eliteScore < 40) level = 'high';
    else if (eliteScore < 60) level = 'moderate';
    else level = 'low';

    if (decision && decision.analysis.risk === 'high' && (level === 'low' || level === 'moderate')) {
      level = 'high';
    }

    return {
      level,
      score: Math.round((100 - eliteScore) * 10) / 10,
      drivers,
    };
  }

  private determineRecommendation(eliteScore: number, risk: MacroRiskAssessment): MacroRecommendation {
    let action: MacroRecommendationAction;
    const reasons: string[] = [];

    if (risk.level === 'extreme') {
      action = 'cash';
      reasons.push('Extreme macro risk regime');
    } else if (risk.level === 'high') {
      action = 'defensive';
      reasons.push('Elevated macro risk');
    } else if (eliteScore >= 70) {
      action = 'opportunistic';
      reasons.push('Supportive macro conditions');
    } else {
      action = 'selective';
      reasons.push('Mixed macro conditions');
    }

    reasons.push(...risk.drivers.slice(0, 2));

    return {
      action,
      summary: this.recommendationSummary(action, eliteScore),
      reasons: [...new Set(reasons)].slice(0, 4),
      score: eliteScore,
    };
  }

  private recommendationSummary(action: MacroRecommendationAction, eliteScore: number): string {
    switch (action) {
      case 'opportunistic':
        return `Macro conditions supportive (score ${eliteScore}); consider adding exposure to macro-sensitive names.`;
      case 'selective':
        return `Macro conditions mixed (score ${eliteScore}); prefer selective, high-quality positions.`;
      case 'defensive':
        return `Macro conditions weak (score ${eliteScore}); lean defensive and reduce cyclical exposure.`;
      case 'cash':
        return 'Extreme macro risk; prioritize capital preservation.';
    }
  }

  private buildComponents(
    base: MacroScoreResult,
    decisionDelta: number,
    yieldDelta: number,
    decision: TCMBDecisionRecord | null,
  ): MacroEliteComponentScore[] {
    const weightMap: Record<keyof MacroScoreResult['components'], number> = {
      monetaryPolicy: 0.25,
      globalRisk: 0.25,
      domesticRisk: 0.2,
      growth: 0.15,
      liquidity: 0.15,
    };

    const components: MacroEliteComponentScore[] = (
      Object.keys(weightMap) as (keyof MacroScoreResult['components'])[]
    ).map((key) => {
      const score = base.components[key];
      return {
        name: key,
        score,
        weight: weightMap[key],
        weighted: Math.round(score * weightMap[key] * 100) / 100,
        status: score === 0 ? 'pending' : 'ready',
        detail: this.componentDetail(key, score),
      };
    });

    components.push({
      name: 'tcmbDecision',
      score: decision ? Math.round((50 + decisionDelta) * 10) / 10 : 50,
      weight: 0,
      weighted: decisionDelta,
      status: decision ? 'ready' : 'pending',
      detail: decision
        ? `sentiment=${decision.analysis.sentiment}, confidence=${decision.analysis.confidence}%`
        : 'no decision captured',
    });

    components.push({
      name: 'yieldCurve',
      score: Math.round((50 + yieldDelta) * 10) / 10,
      weight: 0,
      weighted: yieldDelta,
      status: yieldDelta === 0 ? 'pending' : 'ready',
      detail:
        yieldDelta === 0
          ? 'no yield curve signal'
          : `us10y-us2y spread adjustment ${yieldDelta > 0 ? '+' : ''}${yieldDelta}`,
    });

    return components;
  }

  private componentDetail(key: string, score: number): string {
    if (score === 0) return `no ${key} data available`;
    return `${key} component score ${score}`;
  }
}
