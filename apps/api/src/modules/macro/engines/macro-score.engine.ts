import { Injectable, Logger } from '@nestjs/common';
import { MacroDataPoint, MacroScoreResult, MacroConfig } from '../macro.types';
import { DEFAULT_MACRO_CONFIG } from '../macro.config';

@Injectable()
export class MacroScoreEngine {
  private readonly logger = new Logger(MacroScoreEngine.name);
  private readonly config: MacroConfig;

  constructor() {
    this.config = { ...DEFAULT_MACRO_CONFIG };
  }

  calculate(points: MacroDataPoint[]): MacroScoreResult {
    const monetaryPolicy = this.scoreMonetaryPolicy(points);
    const globalRisk = this.scoreGlobalRisk(points);
    const domesticRisk = this.scoreDomesticRisk(points);
    const growth = this.scoreGrowth(points);
    const liquidity = this.scoreLiquidity(points);

    const weights = this.config.scoring.weights;
    const macroScore = Math.round(
      monetaryPolicy * weights.monetaryPolicy +
      globalRisk * weights.globalRisk +
      domesticRisk * weights.domesticRisk +
      growth * weights.growth +
      liquidity * weights.liquidity
    );

    const confidence = this.computeConfidence(points);

    return {
      macroScore,
      components: { monetaryPolicy, globalRisk, domesticRisk, growth, liquidity },
      confidence,
      calculatedAt: new Date().toISOString(),
    };
  }

  private scoreMonetaryPolicy(points: MacroDataPoint[]): number {
    const tcmb = this.getValue(points, 'tcmb_policy_rate');
    const fed = this.getValue(points, 'fed_rate');
    const ecb = this.getValue(points, 'ecb_rate');

    let score = 60;
    if (tcmb > 30) score -= 20;
    else if (tcmb > 15) score -= 10;

    if (fed > 5) score -= 10;
    else if (fed > 3) score -= 5;

    if (ecb > 4) score -= 5;
    else if (ecb > 2) score -= 3;

    return Math.max(0, Math.min(100, score));
  }

  private scoreGlobalRisk(points: MacroDataPoint[]): number {
    const vix = this.getValue(points, 'vix');
    const dxy = this.getValue(points, 'dxy');

    let score = 70;
    if (vix > 30) score -= 30;
    else if (vix > 20) score -= 15;
    else if (vix > 15) score -= 5;

    if (dxy > 106) score -= 20;
    else if (dxy > 103) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private scoreDomesticRisk(points: MacroDataPoint[]): number {
    const cds = this.getValue(points, 'turkey_cds');
    const inflation = this.getValue(points, 'inflation');
    const usdtry = this.getValue(points, 'usdtry');

    let score = 50;
    if (cds < 250) score += 20;
    else if (cds < 350) score += 10;
    else if (cds > 500) score -= 20;

    if (inflation < 20) score += 15;
    else if (inflation < 40) score += 5;
    else if (inflation > 60) score -= 15;

    if (usdtry < 30) score += 10;
    else if (usdtry > 35) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private scoreGrowth(points: MacroDataPoint[]): number {
    const pmi = this.getValue(points, 'pmi');
    const bist = this.getValue(points, 'bist_sector_indices');

    let score = 50;
    if (pmi > 50) score += 20;
    else if (pmi > 45) score += 5;
    else score -= 15;

    if (bist > 0) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private scoreLiquidity(points: MacroDataPoint[]): number {
    const us10y = this.getValue(points, 'us10y');

    let score = 60;
    if (us10y < 3) score += 20;
    else if (us10y < 4.5) score += 10;
    else if (us10y < 5.5) score -= 10;
    else score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private computeConfidence(points: MacroDataPoint[]): number {
    const fetched = points.filter((p) => p.status === 'fetched').length;
    const total = points.length;
    return total > 0 ? Math.round((fetched / total) * 100) : 0;
  }

  private getValue(points: MacroDataPoint[], source: string): number {
    return points.find((p) => p.source === source)?.value ?? 0;
  }
}
