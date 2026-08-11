import { Injectable, Logger } from '@nestjs/common';
import { MarketRegimeType, MarketRegimeAnalysis, MacroDataPoint } from '../macro.types';

interface RegimeThresholds {
  vixRiskOff: number;
  vixExtreme: number;
  dxyRiskOff: number;
  cdsRiskOff: number;
}

const DEFAULT_THRESHOLDS: RegimeThresholds = {
  vixRiskOff: 25,
  vixExtreme: 40,
  dxyRiskOff: 106,
  cdsRiskOff: 400,
};

@Injectable()
export class MarketRegimeEngine {
  private readonly logger = new Logger(MarketRegimeEngine.name);
  private readonly thresholds: RegimeThresholds;

  constructor() {
    this.thresholds = DEFAULT_THRESHOLDS;
  }

  analyze(points: MacroDataPoint[]): MarketRegimeAnalysis {
    const vix = this.findPoint(points, 'vix');
    const dxy = this.findPoint(points, 'dxy');
    const us10y = this.findPoint(points, 'us10y');
    const cds = this.findPoint(points, 'turkey_cds');

    const vixComp = { value: vix?.value ?? 0, impact: this.calcVixImpact(vix?.value ?? 0) };
    const dxyComp = { value: dxy?.value ?? 0, impact: this.calcDxyImpact(dxy?.value ?? 0) };
    const us10yComp = { value: us10y?.value ?? 0, impact: this.calcUs10yImpact(us10y?.value ?? 0) };
    const cdsComp = { value: cds?.value ?? 0, impact: this.calcCdsImpact(cds?.value ?? 0) };
    const liquidityComp = { value: us10y?.value ?? 0, impact: this.calcLiquidityImpact(us10y?.value ?? 0) };
    const momentumComp = { value: 0, impact: 0 };

    const totalImpact = vixComp.impact + dxyComp.impact + us10yComp.impact + cdsComp.impact + liquidityComp.impact + momentumComp.impact;
    const avgImpact = totalImpact / 6;

    const regime = this.determineRegime(avgImpact);
    const signals = this.generateSignals(vixComp, dxyComp, us10yComp, cdsComp);

    return {
      regime,
      score: Math.round((1 - avgImpact) * 100),
      components: {
        vix: vixComp,
        dxy: dxyComp,
        us10y: us10yComp,
        cds: cdsComp,
        liquidity: liquidityComp,
        momentum: momentumComp,
      },
      signals,
      analyzedAt: new Date().toISOString(),
    };
  }

  private calcVixImpact(vix: number): number {
    if (vix <= 15) return 0;
    if (vix <= 20) return 0.2;
    if (vix <= this.thresholds.vixRiskOff) return 0.4;
    if (vix <= this.thresholds.vixExtreme) return 0.6;
    return 0.9;
  }

  private calcDxyImpact(dxy: number): number {
    if (dxy <= 100) return 0.1;
    if (dxy <= 103) return 0.3;
    if (dxy <= this.thresholds.dxyRiskOff) return 0.5;
    return 0.7;
  }

  private calcUs10yImpact(yield_: number): number {
    if (yield_ <= 3) return 0;
    if (yield_ <= 4) return 0.2;
    if (yield_ <= 5) return 0.5;
    return 0.8;
  }

  private calcCdsImpact(cds: number): number {
    if (cds <= 200) return 0;
    if (cds <= 300) return 0.3;
    if (cds <= this.thresholds.cdsRiskOff) return 0.5;
    return 0.8;
  }

  private calcLiquidityImpact(yield_: number): number {
    if (yield_ <= 3) return 0.1;
    if (yield_ <= 4) return 0.3;
    if (yield_ <= 5.5) return 0.6;
    return 0.8;
  }

  private determineRegime(avgImpact: number): MarketRegimeType {
    if (avgImpact <= 0.25) return 'risk_on';
    if (avgImpact <= 0.45) return 'neutral';
    if (avgImpact <= 0.65) return 'risk_off';
    return 'extreme_risk';
  }

  private generateSignals(
    vix: { value: number; impact: number },
    dxy: { value: number; impact: number },
    us10y: { value: number; impact: number },
    cds: { value: number; impact: number },
  ): string[] {
    const signals: string[] = [];
    if (vix.impact >= 0.6) signals.push(`VIX spike at ${vix.value}`);
    if (dxy.impact >= 0.5) signals.push(`DXY strength at ${dxy.value}`);
    if (us10y.impact >= 0.5) signals.push(`US10Y elevated at ${us10y.value}%`);
    if (cds.impact >= 0.5) signals.push(`CDS elevated at ${cds.value} bps`);
    if (signals.length === 0) signals.push('No significant risk signals');
    return signals;
  }

  private findPoint(points: MacroDataPoint[], source: string): MacroDataPoint | undefined {
    return points.find((p) => p.source === source && p.status === 'fetched');
  }
}
