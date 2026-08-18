import { Injectable, Logger } from '@nestjs/common';
import { MacroDataPoint, MacroScoreResult, MacroConfig } from '../macro.types';
import { DEFAULT_MACRO_CONFIG } from '../macro.config';

type ComponentKey = 'monetaryPolicy' | 'globalRisk' | 'domesticRisk' | 'growth' | 'liquidity';

@Injectable()
export class MacroScoreEngine {
  private readonly logger = new Logger(MacroScoreEngine.name);
  private readonly config: MacroConfig;

  constructor() {
    this.config = { ...DEFAULT_MACRO_CONFIG };
  }

  calculate(points: MacroDataPoint[]): MacroScoreResult {
    const components = {
      monetaryPolicy: this.scoreMonetaryPolicy(points),
      globalRisk: this.scoreGlobalRisk(points),
      domesticRisk: this.scoreDomesticRisk(points),
      growth: this.scoreGrowth(points),
      liquidity: this.scoreLiquidity(points),
    };

    const weights = this.config.scoring.weights;
    const available = (Object.keys(components) as ComponentKey[]).filter(
      (key) => components[key] !== null,
    );

    let macroScore: number | null;
    if (available.length === 0) {
      macroScore = null;
    } else {
      const totalWeight = available.reduce((sum, key) => sum + weights[key], 0);
      const weighted =
        available.reduce((sum, key) => sum + (components[key] as number) * weights[key], 0) /
        totalWeight;
      macroScore = Math.round(weighted);
    }

    const confidence = this.computeConfidence(points);

    return {
      macroScore,
      components: {
        monetaryPolicy: components.monetaryPolicy,
        globalRisk: components.globalRisk,
        domesticRisk: components.domesticRisk,
        growth: components.growth,
        liquidity: components.liquidity,
      },
      confidence,
      calculatedAt: new Date().toISOString(),
    };
  }

  private scoreMonetaryPolicy(points: MacroDataPoint[]): number | null {
    const tcmb = this.getValue(points, 'tcmb_policy_rate');
    const fed = this.getValue(points, 'fed_rate');
    const ecb = this.getValue(points, 'ecb_rate');
    if (tcmb === undefined && fed === undefined && ecb === undefined) return null;

    let score = 60;
    if (tcmb !== undefined) {
      if (tcmb > 30) score -= 20;
      else if (tcmb > 15) score -= 10;
    }

    if (fed !== undefined) {
      if (fed > 5) score -= 10;
      else if (fed > 3) score -= 5;
    }

    if (ecb !== undefined) {
      if (ecb > 4) score -= 5;
      else if (ecb > 2) score -= 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreGlobalRisk(points: MacroDataPoint[]): number | null {
    const vix = this.getValue(points, 'vix');
    const dxy = this.getValue(points, 'dxy');
    if (vix === undefined && dxy === undefined) return null;

    let score = 70;
    if (vix !== undefined) {
      if (vix > 30) score -= 30;
      else if (vix > 20) score -= 15;
      else if (vix > 15) score -= 5;
    }

    if (dxy !== undefined) {
      if (dxy > 106) score -= 20;
      else if (dxy > 103) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreDomesticRisk(points: MacroDataPoint[]): number | null {
    const cds = this.getValue(points, 'turkey_cds');
    const inflation = this.getValue(points, 'inflation');
    const usdtry = this.getValue(points, 'usdtry');
    if (cds === undefined && inflation === undefined && usdtry === undefined) return null;

    let score = 50;
    if (cds !== undefined) {
      if (cds < 250) score += 20;
      else if (cds < 350) score += 10;
      else if (cds > 500) score -= 20;
    }

    if (inflation !== undefined) {
      if (inflation < 20) score += 15;
      else if (inflation < 40) score += 5;
      else if (inflation > 60) score -= 15;
    }

    if (usdtry !== undefined) {
      if (usdtry < 30) score += 10;
      else if (usdtry > 35) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreGrowth(points: MacroDataPoint[]): number | null {
    const pmi = this.getValue(points, 'pmi');
    const bist = this.getValue(points, 'bist_sector_indices');
    if (pmi === undefined && bist === undefined) return null;

    let score = 50;
    if (pmi !== undefined) {
      if (pmi > 50) score += 20;
      else if (pmi > 45) score += 5;
      else score -= 15;
    }

    if (bist !== undefined && bist > 0) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private scoreLiquidity(points: MacroDataPoint[]): number | null {
    const us10y = this.getValue(points, 'us10y');
    if (us10y === undefined) return null;

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

  private getValue(points: MacroDataPoint[], source: string): number | undefined {
    const point = points.find((p) => p.source === source);
    if (!point) return undefined;
    if (point.status !== 'fetched' && point.status !== 'stale') return undefined;
    return point.value;
  }
}
