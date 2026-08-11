import { Injectable } from '@nestjs/common';
import { TechnicalRuleResult } from '../technical-rules/technical-rules.types';
import { TechnicalScore, TechnicalGrade } from '../technical-score/technical-score.types';
import { TechnicalSummary } from './technical-summary.types';
import { Timeframe } from '../indicators/indicator.types';
import {
  DEFAULT_TECHNICAL_SUMMARY_CONFIG,
  TechnicalSummaryConfig,
} from '../technical-summary/technical-summary.config';

const GRADE_OPINIONS: Record<TechnicalGrade, string> = {
  'A+': 'Strong bullish technical setup. Multiple indicators confirm upward momentum.',
  A: 'Bullish technical bias. Most indicators favor upside.',
  B: 'Neutral-to-bullish. Some positive signals but mixed conviction.',
  C: 'Neutral-to-bearish. Weakening technicals warrant caution.',
  D: 'Bearish technical setup. Multiple indicators suggest downside risk.',
};

@Injectable()
export class TechnicalSummaryGenerator {
  private readonly config: TechnicalSummaryConfig;

  constructor() {
    this.config = DEFAULT_TECHNICAL_SUMMARY_CONFIG;
  }

  generate(
    score: TechnicalScore,
    rules: TechnicalRuleResult[],
    timeframe: Timeframe,
  ): TechnicalSummary {
    if (!score.isValid || rules.length === 0) {
      return this.invalidSummary(timeframe);
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];

    const passRules = rules.filter((r) => r.status === 'PASS');
    const warningRules = rules.filter((r) => r.status === 'WARNING');
    const failRules = rules.filter((r) => r.status === 'FAIL');

    for (const r of passRules) {
      if (strengths.length >= this.config.maxStrengths) break;
      const text = this.getTemplate(r.rule, 'pass');
      if (text) strengths.push(text);
    }

    for (const r of [...warningRules, ...failRules]) {
      if (weaknesses.length >= this.config.maxWeaknesses) break;
      const status = r.status === 'WARNING' ? 'warning' : 'fail';
      const text = this.getTemplate(r.rule, status);
      if (text) weaknesses.push(text);
    }

    for (const r of failRules) {
      if (risks.length >= this.config.maxRisks) break;
      const text = this.getFailRisk(r);
      if (text) risks.push(text);
    }

    const recommendations = this.buildRecommendations(score.grade, passRules, failRules, warningRules);

    return {
      timeframe,
      summary: this.buildSummaryLine(score, passRules, failRules, warningRules),
      overallOpinion: GRADE_OPINIONS[score.grade],
      strengths,
      weaknesses,
      risks,
      recommendations,
      metadata: {
        grade: score.grade,
        score: score.score,
        confidence: score.confidence,
        passCount: passRules.length,
        failCount: failRules.length,
        warningCount: warningRules.length,
      },
      isValid: true,
    };
  }

  private buildSummaryLine(
    score: TechnicalScore,
    pass: TechnicalRuleResult[],
    fail: TechnicalRuleResult[],
    warn: TechnicalRuleResult[],
  ): string {
    const parts: string[] = [];
    parts.push(`Technical grade: ${score.grade} (${Math.round(score.score)}/100).`);
    if (pass.length > 0) {
      parts.push(`${pass.length} rule${pass.length > 1 ? 's' : ''} passing.`);
    }
    if (warn.length > 0) {
      parts.push(`${warn.length} warning${warn.length > 1 ? 's' : ''}.`);
    }
    if (fail.length > 0) {
      parts.push(`${fail.length} failing.`);
    }
    return parts.join(' ');
  }

  private buildRecommendations(
    grade: TechnicalGrade,
    pass: TechnicalRuleResult[],
    fail: TechnicalRuleResult[],
    warn: TechnicalRuleResult[],
  ): string[] {
    const recs: string[] = [];
    if (grade === 'A+' || grade === 'A') {
      recs.push('Trend is strong — consider riding momentum with trailing stop');
    } else if (grade === 'D') {
      recs.push('Technical outlook is weak — consider reducing exposure or hedging');
    } else {
      recs.push('Mixed signals — wait for clearer confirmation before acting');
    }

    const hasVolumeWeak = fail.some((r) => r.rule === 'RELATIVE_VOLUME' || r.rule === 'VOLUME_SPIKE');
    if (hasVolumeWeak) {
      recs.push('Volume is weak — be cautious of false breakouts');
    }

    const hasVolatility = warn.some((r) => r.rule === 'ATR') || fail.some((r) => r.rule === 'ATR');
    if (hasVolatility) {
      recs.push('Volatility is elevated — use wider stops or reduce position size');
    }

    return recs.slice(0, this.config.maxRecommendations);
  }

  private getTemplate(rule: string, status: 'pass' | 'warning' | 'fail'): string | null {
    const templates = this.config.ruleTemplates[rule];
    if (!templates) {
      return status === 'pass' ? `${rule} is positive` : status === 'warning' ? `${rule} is neutral` : `${rule} is negative`;
    }
    return templates[status];
  }

  private getFailRisk(rule: TechnicalRuleResult): string | null {
    const riskMap: Record<string, string> = {
      EMA_ALIGNMENT: 'Sustained bearish trend risk',
      SMA_ALIGNMENT: 'Long-term downtrend risk',
      MACD: 'Momentum loss risk',
      RSI: 'Overextension risk in either direction',
      BOS: 'Trend reversal risk',
      CHOCH: 'Trend reversal risk',
      OBV: 'Distribution risk — hidden selling pressure',
      ACCUMULATION: 'Distribution phase risk',
    };
    return riskMap[rule.rule] ?? `${rule.rule} failure adds downside risk`;
  }

  private invalidSummary(timeframe: Timeframe): TechnicalSummary {
    return {
      timeframe,
      summary: 'Insufficient data for technical summary.',
      overallOpinion: 'Cannot form opinion — not enough valid rules.',
      strengths: [],
      weaknesses: [],
      risks: [],
      recommendations: [],
      metadata: {},
      isValid: false,
    };
  }
}
