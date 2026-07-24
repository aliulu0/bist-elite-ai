import { Injectable } from '@nestjs/common';
import { RuleResult, FinancialData, DEFAULT_THRESHOLDS } from '../rule.types';

@Injectable()
export class NetProfitGrowthRule {
  evaluate(data: FinancialData): RuleResult {
    if (data.netProfit == null || data.netProfitPrevious == null) {
      return {
        id: 'net_profit_growth',
        name: 'Net Profit Growth',
        status: 'WARNING',
        value: null,
        reason: 'Net profit data not available for growth calculation',
      };
    }

    if (data.netProfitPrevious === 0) {
      return {
        id: 'net_profit_growth',
        name: 'Net Profit Growth',
        status: 'WARNING',
        value: null,
        reason: 'Previous period net profit is zero, cannot calculate growth',
      };
    }

    const growth =
      ((data.netProfit - data.netProfitPrevious) / Math.abs(data.netProfitPrevious)) * 100;
    const { pass, warning } = DEFAULT_THRESHOLDS.netProfitGrowth;

    if (growth >= pass) {
      return {
        id: 'net_profit_growth',
        name: 'Net Profit Growth',
        status: 'PASS',
        value: growth,
        reason: `Net profit growth of ${growth.toFixed(1)}% exceeds threshold of ${pass}%`,
      };
    }

    if (growth >= warning) {
      return {
        id: 'net_profit_growth',
        name: 'Net Profit Growth',
        status: 'WARNING',
        value: growth,
        reason: `Net profit growth of ${growth.toFixed(1)}% is between ${warning}% and ${pass}%`,
      };
    }

    return {
      id: 'net_profit_growth',
      name: 'Net Profit Growth',
      status: 'FAIL',
      value: growth,
      reason: `Net profit growth of ${growth.toFixed(1)}% is below threshold of ${warning}%`,
    };
  }
}
