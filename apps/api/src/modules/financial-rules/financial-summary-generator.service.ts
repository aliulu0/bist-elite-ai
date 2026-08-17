import { Injectable } from '@nestjs/common';
import { FinancialScoreResult, ScoreGrade } from './score.types';
import { RuleResult, RuleStatus } from './rule.types';
import { FinancialSummary } from './summary.types';

interface RuleTemplate {
  name: string;
  pass: string;
  warning: string;
  fail: string;
  unavailable: string;
}

const RULE_TEMPLATES: Record<string, RuleTemplate> = {
  price_to_book: {
    name: 'Price/Book Ratio',
    pass: 'Attractive valuation relative to book value',
    warning: 'Price/Book ratio is slightly elevated',
    fail: 'Significantly overvalued relative to book value',
    unavailable: 'Price/Book ratio data is unavailable',
  },
  ev_to_ebitda: {
    name: 'EV/EBITDA Ratio',
    pass: 'Reasonable enterprise value relative to earnings',
    warning: 'EV/EBITDA ratio is moderately high',
    fail: 'EV/EBITDA ratio indicates overvaluation',
    unavailable: 'EV/EBITDA data is unavailable',
  },
  net_profit_growth: {
    name: 'Net Profit Growth',
    pass: 'Strong net profit growth',
    warning: 'Net profit growth data is unavailable',
    fail: 'Declining net profit',
    unavailable: 'Net profit growth data is unavailable',
  },
  equity_growth: {
    name: 'Equity Growth',
    pass: 'Healthy equity growth',
    warning: 'Equity growth data is unavailable',
    fail: 'Equity is declining',
    unavailable: 'Equity growth data is unavailable',
  },
  debt_ratio: {
    name: 'Debt Ratio',
    pass: 'Low debt burden',
    warning: 'Debt ratio data is unavailable',
    fail: 'High debt burden',
    unavailable: 'Debt ratio data is unavailable',
  },
  sector_comparison: {
    name: 'Sector Comparison',
    pass: 'Performing in line with sector averages',
    warning: 'Sector comparison data is unavailable',
    fail: 'Significantly deviating from sector averages',
    unavailable: 'Sector comparison data is unavailable',
  },
};

const GRADE_OPINIONS: Record<ScoreGrade, string> = {
  'A+': 'Financial structure is excellent. The company demonstrates strong fundamentals across most metrics.',
  A: 'Financial structure is healthy. The company shows solid financial performance with minor areas for attention.',
  B: 'Financial structure is acceptable. The company has a reasonable financial profile with some areas of concern.',
  C: 'Financial structure is weak. The company shows notable financial issues that warrant caution.',
  D: 'Financial structure is poor. The company exhibits significant financial weaknesses.',
};

@Injectable()
export class FinancialSummaryGenerator {
  generate(scoreResult: FinancialScoreResult, rules: RuleResult[]): FinancialSummary {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const risks: string[] = [];
    const positives: string[] = [];

    for (const rule of rules) {
      const template = RULE_TEMPLATES[rule.id];
      if (!template) continue;

      if (rule.status === 'UNAVAILABLE') continue;

      const text = this.formatRuleText(template, rule);
      this.categorize(rule.status, text, strengths, weaknesses, risks, positives);
    }

    const summary = this.buildSummary(scoreResult);
    const overallOpinion = this.buildOpinion(scoreResult);

    return { summary, strengths, weaknesses, risks, positives, overallOpinion };
  }

  private formatRuleText(template: RuleTemplate, rule: RuleResult): string {
    const key = rule.status.toLowerCase() as 'pass' | 'warning' | 'fail' | 'unavailable';
    const base = template[key];
    if (rule.value !== null) {
      return `${base} (${rule.name}: ${this.formatValue(rule)})`;
    }
    return base;
  }

  private formatValue(rule: RuleResult): string {
    if (rule.id === 'debt_ratio') {
      return `${((rule.value as number) * 100).toFixed(1)}%`;
    }
    if (rule.id === 'net_profit_growth' || rule.id === 'equity_growth') {
      return `${(rule.value as number).toFixed(1)}%`;
    }
    return `${(rule.value as number).toFixed(1)}x`;
  }

  private categorize(
    status: RuleStatus,
    text: string,
    strengths: string[],
    weaknesses: string[],
    risks: string[],
    positives: string[],
  ): void {
    switch (status) {
      case 'PASS':
        strengths.push(text);
        positives.push(text);
        break;
      case 'WARNING':
        weaknesses.push(text);
        break;
      case 'FAIL':
        risks.push(text);
        break;
    }
  }

  private buildSummary(scoreResult: FinancialScoreResult): string {
    const { symbol, score, grade, passedRules, failedRules, warningRules } = scoreResult;

    if (scoreResult.dataStatus === 'UNAVAILABLE') {
      return (
        `${symbol} financial score is UNAVAILABLE: no fundamental data exists to score. ` +
        `Score of ${score}/100 must not be interpreted as a measured financial value.`
      );
    }

    const parts: string[] = [];

    parts.push(`${symbol} scored ${score}/100 (Grade: ${grade}).`);
    parts.push(`${passedRules} rule(s) passed, ${warningRules} warning(s), ${failedRules} failed.`);

    if (failedRules === 0 && warningRules === 0) {
      parts.push('All financial metrics are within healthy ranges.');
    } else if (failedRules === 0) {
      parts.push('No critical issues detected, but some metrics need attention.');
    } else if (failedRules >= 3) {
      parts.push('Multiple financial metrics are concerning.');
    } else {
      parts.push('Some financial metrics require careful evaluation.');
    }

    return parts.join(' ');
  }

  private buildOpinion(scoreResult: FinancialScoreResult): string {
    if (scoreResult.dataStatus === 'UNAVAILABLE') {
      return 'Financial data unavailable: no opinion is issued on fundamentals.';
    }
    return GRADE_OPINIONS[scoreResult.grade];
  }
}
