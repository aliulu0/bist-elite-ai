import { Injectable } from '@nestjs/common';
import {
  RiskCenterWidget,
  RiskMetric,
  SectorConcentration,
  RiskLevel,
} from './types';

@Injectable()
export class RiskCenterService {
  getRiskWidget(data: {
    overallRiskScore: number;
    sectorExposures: { sector: string; weight: number }[];
    maxDrawdown: number;
    currentDrawdown: number;
    volatility: number;
    liquidityRiskLevel: RiskLevel;
    timeframeConflicts: number;
    regimeRiskLevel: RiskLevel;
    riskAlerts?: string[];
  }): RiskCenterWidget {
    const riskMetrics = this.buildRiskMetrics(data);
    const sectorConcentration = this.buildSectorConcentration(data.sectorExposures);
    const overallRiskLevel = this.getRiskLevelFromScore(data.overallRiskScore);

    return {
      overallRiskScore: data.overallRiskScore,
      overallRiskLevel,
      riskMetrics,
      sectorConcentration,
      maxDrawdown: data.maxDrawdown,
      currentDrawdown: data.currentDrawdown,
      volatility: data.volatility,
      liquidityRisk: data.liquidityRiskLevel,
      timeframeConflicts: data.timeframeConflicts,
      regimeRisk: data.regimeRiskLevel,
      riskAlerts: data.riskAlerts || [],
      lastUpdated: new Date().toISOString(),
    };
  }

  calculateRiskScore(params: {
    drawdown: number;
    volatility: number;
    concentration: number;
    liquidityRisk: RiskLevel;
    regimeRisk: RiskLevel;
    conflicts: number;
  }): number {
    const drawdownScore = Math.min(100, params.drawdown * 10);
    const volScore = Math.min(100, params.volatility * 5);
    const concScore = params.concentration;
    const liqScore = this.riskLevelToScore(params.liquidityRisk);
    const regScore = this.riskLevelToScore(params.regimeRisk);
    const conflictScore = Math.min(100, params.conflicts * 25);

    return Math.round(
      drawdownScore * 0.25 +
      volScore * 0.20 +
      concScore * 0.20 +
      liqScore * 0.10 +
      regScore * 0.10 +
      conflictScore * 0.15
    );
  }

  getRiskLevelFromScore(score: number): RiskLevel {
    if (score <= 30) return RiskLevel.LOW;
    if (score <= 55) return RiskLevel.MEDIUM;
    if (score <= 80) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  detectConcentrationRisk(sectorWeights: { sector: string; weight: number }[]): { sector: string; risk: RiskLevel; message: string }[] {
    const results: { sector: string; risk: RiskLevel; message: string }[] = [];
    for (const sw of sectorWeights) {
      if (sw.weight > 40) {
        results.push({ sector: sw.sector, risk: RiskLevel.CRITICAL, message: `${sw.sector} konsantrasyonu kritik: %${sw.weight.toFixed(1)}` });
      } else if (sw.weight > 25) {
        results.push({ sector: sw.sector, risk: RiskLevel.HIGH, message: `${sw.sector} konsantrasyonu yuksek: %${sw.weight.toFixed(1)}` });
      } else if (sw.weight > 15) {
        results.push({ sector: sw.sector, risk: RiskLevel.MEDIUM, message: `${sw.sector} konsantrasyonu orta: %${sw.weight.toFixed(1)}` });
      }
    }
    return results;
  }

  private buildRiskMetrics(data: {
    overallRiskScore: number;
    maxDrawdown: number;
    currentDrawdown: number;
    volatility: number;
    liquidityRiskLevel: RiskLevel;
    timeframeConflicts: number;
    regimeRiskLevel: RiskLevel;
  }): RiskMetric[] {
    return [
      {
        label: 'Portfoy Riski',
        value: data.overallRiskScore,
        threshold: 60,
        level: this.getRiskLevelFromScore(data.overallRiskScore),
        description: 'Genel portfoy risk skoru',
      },
      {
        label: 'Cekilme Riski',
        value: data.currentDrawdown,
        threshold: data.maxDrawdown * 0.5,
        level: this.getRiskLevelFromScore(data.currentDrawdown * 2),
        description: `Maks cekilme: %${data.maxDrawdown.toFixed(1)}`,
      },
      {
        label: 'Volatilite',
        value: data.volatility,
        threshold: 25,
        level: this.getRiskLevelFromScore(data.volatility * 4),
        description: 'Portfoy volatilitesi',
      },
      {
        label: 'Likitidite Riski',
        value: this.riskLevelToScore(data.liquidityRiskLevel),
        threshold: 60,
        level: data.liquidityRiskLevel,
        description: 'Piyasa likitidite durumu',
      },
      {
        label: 'Zaman Cercevesi Cakismasi',
        value: data.timeframeConflicts,
        threshold: 2,
        level: data.timeframeConflicts >= 3 ? RiskLevel.HIGH : data.timeframeConflicts >= 1 ? RiskLevel.MEDIUM : RiskLevel.LOW,
        description: `${data.timeframeConflicts} cerceve cakismasi`,
      },
      {
        label: 'Rejim Riski',
        value: this.riskLevelToScore(data.regimeRiskLevel),
        threshold: 60,
        level: data.regimeRiskLevel,
        description: 'Piyasa rejimi bazli risk',
      },
    ];
  }

  private buildSectorConcentration(exposures: { sector: string; weight: number }[]): SectorConcentration[] {
    return exposures.map(e => ({
      sector: e.sector,
      weight: e.weight,
      riskLevel: e.weight > 30 ? RiskLevel.HIGH : e.weight > 20 ? RiskLevel.MEDIUM : RiskLevel.LOW,
    }));
  }

  private riskLevelToScore(level: RiskLevel): number {
    switch (level) {
      case RiskLevel.LOW: return 20;
      case RiskLevel.MEDIUM: return 50;
      case RiskLevel.HIGH: return 75;
      case RiskLevel.CRITICAL: return 95;
    }
  }
}
