import { Injectable } from '@nestjs/common';
import { RuleResult, FinancialData, DEFAULT_THRESHOLDS } from '../rule.types';

@Injectable()
export class SectorComparisonRule {
  evaluate(data: FinancialData): RuleResult {
    if (!data.sector || !data.sectorAverages) {
      return {
        id: 'sector_comparison',
        name: 'Sector Comparison',
        status: 'UNAVAILABLE',
        value: null,
        reason: 'Sector data or averages not available for comparison',
      };
    }

    const deviations: number[] = [];

    if (
      data.priceToBook != null &&
      data.sectorAverages.priceToBook != null &&
      data.sectorAverages.priceToBook > 0
    ) {
      const deviation =
        (Math.abs(data.priceToBook - data.sectorAverages.priceToBook) /
          data.sectorAverages.priceToBook) *
        100;
      deviations.push(deviation);
    }

    if (
      data.enterpriseValueToEBITDA != null &&
      data.sectorAverages.enterpriseValueToEBITDA != null &&
      data.sectorAverages.enterpriseValueToEBITDA > 0
    ) {
      const deviation =
        (Math.abs(data.enterpriseValueToEBITDA - data.sectorAverages.enterpriseValueToEBITDA) /
          data.sectorAverages.enterpriseValueToEBITDA) *
        100;
      deviations.push(deviation);
    }

    if (
      data.totalDebt != null &&
      data.totalAssets != null &&
      data.totalAssets > 0 &&
      data.sectorAverages.debtRatio != null
    ) {
      const companyDebtRatio = data.totalDebt / data.totalAssets;
      const deviation =
        (Math.abs(companyDebtRatio - data.sectorAverages.debtRatio) /
          data.sectorAverages.debtRatio) *
        100;
      deviations.push(deviation);
    }

    if (deviations.length === 0) {
      return {
        id: 'sector_comparison',
        name: 'Sector Comparison',
        status: 'UNAVAILABLE',
        value: null,
        reason: 'No comparable metrics available for sector analysis',
      };
    }

    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const { pass, warning } = DEFAULT_THRESHOLDS.sectorDeviation;

    if (avgDeviation <= pass) {
      return {
        id: 'sector_comparison',
        name: 'Sector Comparison',
        status: 'PASS',
        value: avgDeviation,
        reason: `Average sector deviation of ${avgDeviation.toFixed(1)}% is below threshold of ${pass}%`,
      };
    }

    if (avgDeviation <= warning) {
      return {
        id: 'sector_comparison',
        name: 'Sector Comparison',
        status: 'WARNING',
        value: avgDeviation,
        reason: `Average sector deviation of ${avgDeviation.toFixed(1)}% is between ${pass}% and ${warning}%`,
      };
    }

    return {
      id: 'sector_comparison',
      name: 'Sector Comparison',
      status: 'FAIL',
      value: avgDeviation,
      reason: `Average sector deviation of ${avgDeviation.toFixed(1)}% exceeds threshold of ${warning}%`,
    };
  }
}
