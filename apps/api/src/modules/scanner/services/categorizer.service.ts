import { Injectable } from '@nestjs/common';
import { ScannerResult, ScannerCategory, CategoryThresholds } from '../scanner.types';

@Injectable()
export class Categorizer {
  private readonly thresholds: CategoryThresholds;

  constructor(thresholds: CategoryThresholds) {
    this.thresholds = thresholds;
  }

  assign(result: ScannerResult): ScannerCategory {
    const { scannerScore, opportunityTypes, age, priority, risks, weaknesses } = result;

    if (priority === 'CRITICAL' && scannerScore >= this.thresholds.hot) {
      return 'HOT';
    }
    if (opportunityTypes.includes('MOMENTUM_BREAKOUT') && scannerScore >= this.thresholds.momentum) {
      return 'MOMENTUM';
    }
    if (opportunityTypes.includes('TREND_REVERSAL') && scannerScore >= this.thresholds.recovery) {
      return 'RECOVERY';
    }
    if (opportunityTypes.includes('UNDERVALUATION') && scannerScore >= this.thresholds.undervalued) {
      return 'UNDERVALUED';
    }
    if (opportunityTypes.includes('FUNDAMENTAL_IMPROVEMENT') && scannerScore >= this.thresholds.growth) {
      return 'GROWTH';
    }
    if (opportunityTypes.includes('INSTITUTIONAL_ACCUMULATION') && scannerScore >= this.thresholds.trending) {
      return 'TRENDING';
    }
    if (age === 'NEW' && scannerScore >= this.thresholds.emerging) {
      return 'EMERGING';
    }
    if (risks.length === 0 && weaknesses.length <= 1 && scannerScore >= this.thresholds.defensive) {
      return 'DEFENSIVE';
    }
    if (scannerScore >= this.thresholds.income && risks.length <= 2) {
      return 'INCOME';
    }
    if (scannerScore >= this.thresholds.speculative) {
      return 'SPECULATIVE';
    }

    return 'CUSTOM';
  }

  categorizeAll(results: ScannerResult[]): ScannerResult[] {
    return results.map((r) => ({
      ...r,
      category: this.assign(r),
    }));
  }
}
