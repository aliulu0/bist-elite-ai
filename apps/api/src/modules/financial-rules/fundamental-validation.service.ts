import { Injectable } from '@nestjs/common';
import { FinancialRulesEngine } from './financial-rules-engine.service';
import { FinancialData, RuleResult, RuleStatus } from './rule.types';
import { DEFAULT_THRESHOLDS } from './rule.types';
import {
  mapToFundamentalData,
  mapToFinancialData,
  FundamentalProviderInputs,
  FinancialDataOverrides,
} from '../analysis-pipeline/fundamental.mapper';

export type Availability = 'AVAILABLE' | 'UNAVAILABLE';
export type FilterStatus = 'PASS' | 'WATCH' | 'FAIL' | 'UNKNOWN';

export interface Thresholds {
  pass: number;
  warning: number;
}

export interface FundamentalFilterResult {
  id: string;
  name: string;
  availability: Availability;
  status: FilterStatus;
  value: number | null;
  thresholds: Thresholds | null;
  reason: string;
}

export interface FundamentalValidationReport {
  symbol: string;
  pdDd: FundamentalFilterResult;
  fdFavok: FundamentalFilterResult;
  netProfitGrowth: FundamentalFilterResult;
  equityGrowth: FundamentalFilterResult;
  debtRatio: FundamentalFilterResult;
  sectorRelative: FundamentalFilterResult;
  overallStatus: FilterStatus;
  score: number;
  availableFilters: string[];
  unknownFilters: string[];
  reasons: string[];
  timestamp: string;
}

const RULE_THRESHOLD_MAP: Record<string, keyof typeof DEFAULT_THRESHOLDS> = {
  price_to_book: 'priceToBook',
  ev_to_ebitda: 'evToEbitda',
  net_profit_growth: 'netProfitGrowth',
  equity_growth: 'equityGrowth',
  debt_ratio: 'debtRatio',
  sector_comparison: 'sectorDeviation',
};

const HUMAN_NAME: Record<string, string> = {
  price_to_book: 'PD/DD',
  ev_to_ebitda: 'FD/FAVÖK',
  net_profit_growth: 'Net Kar Büyüme',
  equity_growth: 'Sermaye Büyüme',
  debt_ratio: 'Borç Oranı',
  sector_comparison: 'Sektöre Göre',
};

@Injectable()
export class FundamentalValidationService {
  constructor(private readonly rulesEngine: FinancialRulesEngine) {}

  validate(data: FinancialData): FundamentalValidationReport {
    const rules = this.rulesEngine.evaluate(data).rules;
    const filters = rules.map((rule) => this.toFilter(rule));

    const overallStatus = this.computeOverallStatus(filters);
    const score = this.computeScore(filters);
    const reasons = this.buildReasons(filters);
    const timestamp = new Date().toISOString();

    return {
      symbol: data.symbol,
      pdDd: filters[0],
      fdFavok: filters[1],
      netProfitGrowth: filters[2],
      equityGrowth: filters[3],
      debtRatio: filters[4],
      sectorRelative: filters[5],
      overallStatus,
      score,
      availableFilters: filters.filter((f) => f.availability === 'AVAILABLE').map((f) => f.id),
      unknownFilters: filters.filter((f) => f.availability === 'UNAVAILABLE').map((f) => f.id),
      reasons,
      timestamp,
    };
  }

  fromProviderInputs(
    symbol: string,
    inputs: FundamentalProviderInputs,
    overrides: FinancialDataOverrides = {},
  ): FundamentalValidationReport {
    const fundamental = mapToFundamentalData(inputs);
    const data = mapToFinancialData(symbol, fundamental, {
      netProfitPrevious: overrides.netProfitPrevious ?? inputs.netProfitPrevious ?? null,
      equityPrevious: overrides.equityPrevious ?? inputs.equityPrevious ?? null,
      sectorAverages: overrides.sectorAverages ?? inputs.sectorAverages,
    });
    return this.validate(data);
  }

  private toFilter(rule: RuleResult): FundamentalFilterResult {
    const thresholdsKey = RULE_THRESHOLD_MAP[rule.id];
    const thresholds = thresholdsKey ? { ...DEFAULT_THRESHOLDS[thresholdsKey] } : null;
    const available = rule.value !== null;
    return {
      id: rule.id,
      name: HUMAN_NAME[rule.id] ?? rule.name,
      availability: available ? 'AVAILABLE' : 'UNAVAILABLE',
      status: this.toStatus(rule.status, rule.value),
      value: rule.value,
      thresholds,
      reason: rule.reason,
    };
  }

  private toStatus(ruleStatus: RuleStatus, value: number | null): FilterStatus {
    if (value === null) return 'UNKNOWN';
    if (ruleStatus === 'PASS') return 'PASS';
    if (ruleStatus === 'WARNING') return 'WATCH';
    return 'FAIL';
  }

  private computeOverallStatus(filters: FundamentalFilterResult[]): FilterStatus {
    const available = filters.filter((f) => f.availability === 'AVAILABLE');
    if (available.length === 0) return 'UNKNOWN';
    if (available.some((f) => f.status === 'FAIL')) return 'FAIL';
    if (available.some((f) => f.status === 'WATCH')) return 'WATCH';
    return 'PASS';
  }

  private computeScore(filters: FundamentalFilterResult[]): number {
    const available = filters.filter((f) => f.availability === 'AVAILABLE');
    if (available.length === 0) return 0;
    const points = available.reduce((sum, f) => {
      if (f.status === 'PASS') return sum + 100;
      if (f.status === 'WATCH') return sum + 50;
      return sum + 0;
    }, 0);
    return Math.round(points / available.length);
  }

  private buildReasons(filters: FundamentalFilterResult[]): string[] {
    const reasons: string[] = [];
    for (const f of filters) {
      if (f.availability === 'UNAVAILABLE') {
        reasons.push(`${f.name}: veri yok (UNKNOWN)`);
        continue;
      }
      const isRatio = f.id === 'price_to_book' || f.id === 'ev_to_ebitda';
      const decimals = f.id === 'debt_ratio' ? 2 : isRatio ? 1 : 1;
      const formatted = f.value !== null ? f.value.toFixed(decimals) : '-';
      if (f.status === 'PASS') {
        reasons.push(`${f.name}: geçti (${formatted})`);
      } else if (f.status === 'WATCH') {
        reasons.push(`${f.name}: izle (${formatted})`);
      } else {
        reasons.push(`${f.name}: başarısız (${formatted})`);
      }
    }
    return reasons;
  }
}
