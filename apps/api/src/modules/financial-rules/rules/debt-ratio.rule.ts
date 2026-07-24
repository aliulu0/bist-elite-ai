import { Injectable } from '@nestjs/common';
import { RuleResult, FinancialData, DEFAULT_THRESHOLDS } from '../rule.types';

@Injectable()
export class DebtRatioRule {
  evaluate(data: FinancialData): RuleResult {
    if (data.totalDebt == null || data.totalAssets == null) {
      return {
        id: 'debt_ratio',
        name: 'Debt Ratio',
        status: 'WARNING',
        value: null,
        reason: 'Debt or asset data not available for ratio calculation',
      };
    }

    if (data.totalAssets === 0) {
      return {
        id: 'debt_ratio',
        name: 'Debt Ratio',
        status: 'WARNING',
        value: null,
        reason: 'Total assets is zero, cannot calculate debt ratio',
      };
    }

    const ratio = data.totalDebt / data.totalAssets;
    const { pass, warning } = DEFAULT_THRESHOLDS.debtRatio;

    if (ratio <= pass) {
      return {
        id: 'debt_ratio',
        name: 'Debt Ratio',
        status: 'PASS',
        value: ratio,
        reason: `Debt ratio of ${(ratio * 100).toFixed(1)}% is below threshold of ${pass * 100}%`,
      };
    }

    if (ratio <= warning) {
      return {
        id: 'debt_ratio',
        name: 'Debt Ratio',
        status: 'WARNING',
        value: ratio,
        reason: `Debt ratio of ${(ratio * 100).toFixed(1)}% is between ${pass * 100}% and ${warning * 100}%`,
      };
    }

    return {
      id: 'debt_ratio',
      name: 'Debt Ratio',
      status: 'FAIL',
      value: ratio,
      reason: `Debt ratio of ${(ratio * 100).toFixed(1)}% exceeds threshold of ${warning * 100}%`,
    };
  }
}
