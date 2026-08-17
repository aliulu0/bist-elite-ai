import { Injectable } from '@nestjs/common';
import { RuleResult, FinancialData, DEFAULT_THRESHOLDS } from '../rule.types';

@Injectable()
export class EquityGrowthRule {
  evaluate(data: FinancialData): RuleResult {
    if (data.equity == null || data.equityPrevious == null) {
      return {
        id: 'equity_growth',
        name: 'Equity Growth',
        status: 'UNAVAILABLE',
        value: null,
        reason: 'Equity data not available for growth calculation',
      };
    }

    if (data.equityPrevious === 0) {
      return {
        id: 'equity_growth',
        name: 'Equity Growth',
        status: 'UNAVAILABLE',
        value: null,
        reason: 'Previous period equity is zero, cannot calculate growth',
      };
    }

    const growth = ((data.equity - data.equityPrevious) / Math.abs(data.equityPrevious)) * 100;
    const { pass, warning } = DEFAULT_THRESHOLDS.equityGrowth;

    if (growth >= pass) {
      return {
        id: 'equity_growth',
        name: 'Equity Growth',
        status: 'PASS',
        value: growth,
        reason: `Equity growth of ${growth.toFixed(1)}% exceeds threshold of ${pass}%`,
      };
    }

    if (growth >= warning) {
      return {
        id: 'equity_growth',
        name: 'Equity Growth',
        status: 'WARNING',
        value: growth,
        reason: `Equity growth of ${growth.toFixed(1)}% is between ${warning}% and ${pass}%`,
      };
    }

    return {
      id: 'equity_growth',
      name: 'Equity Growth',
      status: 'FAIL',
      value: growth,
      reason: `Equity growth of ${growth.toFixed(1)}% is below threshold of ${warning}%`,
    };
  }
}
