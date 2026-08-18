import { Injectable, Logger } from '@nestjs/common';
import { SectorImpact, MarketRegimeAnalysis, MacroDataPoint, MarketImpact } from '../macro.types';

interface SectorConfig {
  name: string;
  sensitivity: {
    interestRate: number;
    currency: number;
    growth: number;
    risk: number;
  };
}

const SECTORS: SectorConfig[] = [
  { name: 'Banking', sensitivity: { interestRate: 0.9, currency: 0.3, growth: 0.5, risk: 0.8 } },
  { name: 'Industrial', sensitivity: { interestRate: 0.4, currency: 0.3, growth: 0.7, risk: 0.3 } },
  { name: 'Export', sensitivity: { interestRate: 0.2, currency: 0.8, growth: 0.6, risk: 0.4 } },
  {
    name: 'Construction',
    sensitivity: { interestRate: 0.8, currency: 0.2, growth: 0.6, risk: 0.5 },
  },
  { name: 'Technology', sensitivity: { interestRate: 0.5, currency: 0.2, growth: 0.8, risk: 0.6 } },
  { name: 'Energy', sensitivity: { interestRate: 0.3, currency: 0.6, growth: 0.4, risk: 0.5 } },
  {
    name: 'Food & Beverage',
    sensitivity: { interestRate: 0.4, currency: 0.4, growth: 0.5, risk: 0.3 },
  },
  { name: 'Telecom', sensitivity: { interestRate: 0.5, currency: 0.3, growth: 0.4, risk: 0.3 } },
  {
    name: 'Real Estate',
    sensitivity: { interestRate: 0.9, currency: 0.2, growth: 0.5, risk: 0.7 },
  },
  { name: 'Defense', sensitivity: { interestRate: 0.2, currency: 0.2, growth: 0.3, risk: 0.2 } },
];

@Injectable()
export class SectorImpactEngine {
  private readonly logger = new Logger(SectorImpactEngine.name);

  estimate(points: MacroDataPoint[], regime: MarketRegimeAnalysis): SectorImpact[] {
    const us10y = this.getValue(points, 'us10y');
    const usdtry = this.getValue(points, 'usdtry');
    const pmi = this.getValue(points, 'pmi');
    const regimeScore = regime.score;

    return SECTORS.map((sector) => {
      const rateImpact = this.calcRateImpact(us10y, sector.sensitivity.interestRate);
      const currencyImpact = this.calcCurrencyImpact(usdtry, sector.sensitivity.currency);
      const growthImpact = this.calcGrowthImpact(pmi, sector.sensitivity.growth);
      const riskPenalty =
        regimeScore === null ? 0 : ((100 - regimeScore) / 100) * sector.sensitivity.risk;

      const rawScore =
        50 - rateImpact * 15 - currencyImpact * 10 + growthImpact * 15 - riskPenalty * 20;

      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const impact = this.scoreToImpact(score);
      const drivers = this.generateDrivers(
        sector,
        rateImpact,
        currencyImpact,
        growthImpact,
        riskPenalty,
      );

      return { sector: sector.name, impact, score, drivers };
    });
  }

  private calcRateImpact(rate: number, sensitivity: number): number {
    if (rate <= 3) return -0.3;
    if (rate <= 4.5) return 0;
    if (rate <= 6) return 0.4 * sensitivity;
    return 0.8 * sensitivity;
  }

  private calcCurrencyImpact(usdtry: number, sensitivity: number): number {
    if (usdtry <= 30) return 0;
    if (usdtry <= 33) return 0.2 * sensitivity;
    if (usdtry <= 36) return 0.5 * sensitivity;
    return 0.7 * sensitivity;
  }

  private calcGrowthImpact(pmi: number, sensitivity: number): number {
    if (pmi > 50) return 0.5 * sensitivity;
    if (pmi > 45) return 0;
    return -0.3 * sensitivity;
  }

  private scoreToImpact(score: number): MarketImpact {
    if (score >= 55) return 'positive';
    if (score >= 45) return 'neutral';
    return 'negative';
  }

  private generateDrivers(
    sector: SectorConfig,
    rate: number,
    currency: number,
    growth: number,
    risk: number,
  ): string[] {
    const drivers: string[] = [];
    if (rate > 0.2) drivers.push(`Interest rate sensitivity`);
    if (rate < -0.1) drivers.push(`Falling rates benefit`);
    if (currency > 0.2) drivers.push(`Currency pressure`);
    if (growth > 0.2) drivers.push(`Growth momentum`);
    if (growth < -0.1) drivers.push(`Growth slowdown`);
    if (risk > 0.2) drivers.push(`Risk aversion`);
    if (drivers.length === 0) drivers.push('Stable conditions');
    return drivers;
  }

  private getValue(points: MacroDataPoint[], source: string): number {
    return points.find((p) => p.source === source)?.value ?? 0;
  }
}
