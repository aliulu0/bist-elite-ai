import { Injectable } from '@nestjs/common';
import {
  MarketRegimeType,
  RegimeHistoricalData,
  RegimePerformanceByType,
  RegimeTransition,
  MARKET_REGIME_LIST,
} from './types';

@Injectable()
export class RegimeHistoricalService {
  getRegimeDuration(
    currentRegime: MarketRegimeType,
    history: MarketRegimeType[],
  ): number {
    let duration = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] === currentRegime) {
        duration++;
      } else {
        break;
      }
    }
    return duration;
  }

  getRegimeFrequency(history: MarketRegimeType[]): RegimeHistoricalData[] {
    const counts: Record<MarketRegimeType, number> = {} as Record<MarketRegimeType, number>;
    const durations: Record<MarketRegimeType, number[]> = {} as Record<MarketRegimeType, number[]>;

    for (const regime of MARKET_REGIME_LIST) {
      counts[regime] = 0;
      durations[regime] = [];
    }

    let currentRegime: MarketRegimeType | null = null;
    let currentDuration = 0;

    for (const regime of history) {
      counts[regime]++;

      if (regime === currentRegime) {
        currentDuration++;
      } else {
        if (currentRegime !== null) {
          durations[currentRegime].push(currentDuration);
        }
        currentRegime = regime;
        currentDuration = 1;
      }
    }

    if (currentRegime !== null) {
      durations[currentRegime].push(currentDuration);
    }

    return MARKET_REGIME_LIST.map((regime) => {
      const regimeDurations = durations[regime];
      const totalDuration = regimeDurations.reduce((sum, d) => sum + d, 0);
      return {
        regime,
        occurrences: counts[regime],
        avgDuration: regimeDurations.length > 0 ? totalDuration / regimeDurations.length : 0,
        totalDuration,
        firstSeen: history.indexOf(regime) >= 0 ? `day_${history.indexOf(regime)}` : '',
        lastSeen: history.lastIndexOf(regime) >= 0 ? `day_${history.lastIndexOf(regime)}` : '',
      };
    }).filter((d) => d.occurrences > 0);
  }

  getRegimePerformance(
    regime: MarketRegimeType,
    recommendations: Array<{
      strategyName?: string;
      winRate?: number;
      avgReturn?: number;
      sharpeRatio?: number;
    }>,
  ): RegimePerformanceByType {
    const strategyPerformance: Record<
      string,
      { winRate: number; avgReturn: number; sharpeRatio: number }
    > = {};

    for (const rec of recommendations) {
      const name = rec.strategyName || 'default';
      if (!strategyPerformance[name]) {
        strategyPerformance[name] = { winRate: 0, avgReturn: 0, sharpeRatio: 0 };
      }
      strategyPerformance[name].winRate += rec.winRate || 0;
      strategyPerformance[name].avgReturn += rec.avgReturn || 0;
      strategyPerformance[name].sharpeRatio += rec.sharpeRatio || 0;
    }

    return { regime, strategyPerformance };
  }

  getTransitionFrequency(transitions: RegimeTransition[]): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const t of transitions) {
      const key = `${t.from}->${t.to}`;
      freq[key] = (freq[key] || 0) + 1;
    }
    return freq;
  }

  compareRegimes(
    regime1: MarketRegimeType,
    regime2: MarketRegimeType,
    history: MarketRegimeType[],
  ): string {
    const freq1 = history.filter((r) => r === regime1).length;
    const freq2 = history.filter((r) => r === regime2).length;

    if (freq1 > freq2) {
      return `${regime1} tarihce de daha sik goruldu (${freq1} kez vs ${freq2} kez)`;
    }
    if (freq2 > freq1) {
      return `${regime2} tarihce de daha sik goruldu (${freq2} kez vs ${freq1} kez)`;
    }
    return `Her iki rejim de esit siklikla goruldu (${freq1} kez)`;
  }
}
