import { Injectable } from '@nestjs/common';
import {
  MarketRegimeType,
  RegimeInput,
  RegimeTimeframe,
  RegimeTransition,
  TransitionType,
  MARKET_REGIME_CONFIG_DEFAULTS,
} from './types';

@Injectable()
export class RegimeTransitionService {
  private config = { ...MARKET_REGIME_CONFIG_DEFAULTS };

  detectTransitions(
    current: MarketRegimeType,
    history: MarketRegimeType[],
    timeframe: RegimeTimeframe = RegimeTimeframe.D1,
  ): RegimeTransition[] {
    const transitions: RegimeTransition[] = [];

    if (history.length === 0) return transitions;

    const recentHistory = history.slice(-10);
    const regimeChanges: { from: MarketRegimeType; to: MarketRegimeType; index: number }[] = [];

    for (let i = 1; i < recentHistory.length; i++) {
      if (recentHistory[i] !== recentHistory[i - 1]) {
        regimeChanges.push({
          from: recentHistory[i - 1],
          to: recentHistory[i],
          index: i,
        });
      }
    }

    if (regimeChanges.length > 0) {
      const lastChange = regimeChanges[regimeChanges.length - 1];
      const indicators = this.getTransitionIndicators(lastChange.from, lastChange.to);
      const probability = this.calculateTransitionProbability(lastChange.from, {} as RegimeInput);

      transitions.push({
        from: lastChange.from,
        to: lastChange.to,
        probability,
        timeframe,
        indicators,
        detectedAt: new Date().toISOString(),
      });
    }

    return transitions;
  }

  calculateTransitionProbability(
    from: MarketRegimeType,
    input: RegimeInput,
  ): number {
    const transitionMatrix: Record<MarketRegimeType, Partial<Record<MarketRegimeType, number>>> = {
      [MarketRegimeType.STRONG_BULL]: {
        [MarketRegimeType.BULL]: 0.4,
        [MarketRegimeType.DISTRIBUTION]: 0.25,
        [MarketRegimeType.CORRECTION]: 0.15,
        [MarketRegimeType.SIDEWAYS]: 0.1,
        [MarketRegimeType.HIGH_VOLATILITY]: 0.1,
      },
      [MarketRegimeType.BULL]: {
        [MarketRegimeType.STRONG_BULL]: 0.3,
        [MarketRegimeType.WEAK_BULL]: 0.25,
        [MarketRegimeType.DISTRIBUTION]: 0.15,
        [MarketRegimeType.SIDEWAYS]: 0.15,
        [MarketRegimeType.CORRECTION]: 0.15,
      },
      [MarketRegimeType.WEAK_BULL]: {
        [MarketRegimeType.BULL]: 0.25,
        [MarketRegimeType.SIDEWAYS]: 0.35,
        [MarketRegimeType.CORRECTION]: 0.2,
        [MarketRegimeType.WEAK_BEAR]: 0.2,
      },
      [MarketRegimeType.SIDEWAYS]: {
        [MarketRegimeType.WEAK_BULL]: 0.2,
        [MarketRegimeType.WEAK_BEAR]: 0.2,
        [MarketRegimeType.BULL]: 0.15,
        [MarketRegimeType.BEAR]: 0.15,
        [MarketRegimeType.ACCUMULATION]: 0.15,
        [MarketRegimeType.DISTRIBUTION]: 0.15,
      },
      [MarketRegimeType.WEAK_BEAR]: {
        [MarketRegimeType.SIDEWAYS]: 0.3,
        [MarketRegimeType.BEAR]: 0.3,
        [MarketRegimeType.WEAK_BULL]: 0.15,
        [MarketRegimeType.RECOVERY]: 0.1,
        [MarketRegimeType.ACCUMULATION]: 0.15,
      },
      [MarketRegimeType.BEAR]: {
        [MarketRegimeType.WEAK_BEAR]: 0.25,
        [MarketRegimeType.STRONG_BEAR]: 0.2,
        [MarketRegimeType.RECOVERY]: 0.15,
        [MarketRegimeType.ACCUMULATION]: 0.2,
        [MarketRegimeType.SIDEWAYS]: 0.2,
      },
      [MarketRegimeType.STRONG_BEAR]: {
        [MarketRegimeType.BEAR]: 0.35,
        [MarketRegimeType.RECOVERY]: 0.25,
        [MarketRegimeType.ACCUMULATION]: 0.25,
        [MarketRegimeType.HIGH_VOLATILITY]: 0.15,
      },
      [MarketRegimeType.HIGH_VOLATILITY]: {
        [MarketRegimeType.SIDEWAYS]: 0.3,
        [MarketRegimeType.BEAR]: 0.2,
        [MarketRegimeType.BULL]: 0.2,
        [MarketRegimeType.WEAK_BEAR]: 0.15,
        [MarketRegimeType.WEAK_BULL]: 0.15,
      },
      [MarketRegimeType.LOW_VOLATILITY]: {
        [MarketRegimeType.SIDEWAYS]: 0.4,
        [MarketRegimeType.WEAK_BULL]: 0.2,
        [MarketRegimeType.WEAK_BEAR]: 0.2,
        [MarketRegimeType.ACCUMULATION]: 0.1,
        [MarketRegimeType.DISTRIBUTION]: 0.1,
      },
      [MarketRegimeType.RECOVERY]: {
        [MarketRegimeType.WEAK_BULL]: 0.35,
        [MarketRegimeType.BULL]: 0.25,
        [MarketRegimeType.SIDEWAYS]: 0.2,
        [MarketRegimeType.ACCUMULATION]: 0.1,
        [MarketRegimeType.CORRECTION]: 0.1,
      },
      [MarketRegimeType.CORRECTION]: {
        [MarketRegimeType.WEAK_BEAR]: 0.3,
        [MarketRegimeType.SIDEWAYS]: 0.25,
        [MarketRegimeType.RECOVERY]: 0.15,
        [MarketRegimeType.BEAR]: 0.15,
        [MarketRegimeType.ACCUMULATION]: 0.15,
      },
      [MarketRegimeType.DISTRIBUTION]: {
        [MarketRegimeType.CORRECTION]: 0.25,
        [MarketRegimeType.SIDEWAYS]: 0.25,
        [MarketRegimeType.WEAK_BEAR]: 0.2,
        [MarketRegimeType.BEAR]: 0.15,
        [MarketRegimeType.WEAK_BULL]: 0.15,
      },
      [MarketRegimeType.ACCUMULATION]: {
        [MarketRegimeType.RECOVERY]: 0.3,
        [MarketRegimeType.WEAK_BULL]: 0.25,
        [MarketRegimeType.SIDEWAYS]: 0.25,
        [MarketRegimeType.BULL]: 0.1,
        [MarketRegimeType.LOW_VOLATILITY]: 0.1,
      },
    };

    const probabilities = transitionMatrix[from] || {};
    const maxProb = Math.max(...Object.values(probabilities), 0.1);

    if (input && input.momentumScore !== undefined) {
      const momentumBoost = input.momentumScore * 0.1;
      return Math.min(1, Math.max(0.05, maxProb + momentumBoost));
    }

    return Math.min(1, Math.max(0.05, maxProb));
  }

  detectEmergingTrends(history: MarketRegimeType[]): TransitionType[] {
    const types: TransitionType[] = [];
    if (history.length < 3) return types;

    const recent = history.slice(-3);
    const isBullShift =
      recent[2] === MarketRegimeType.BULL ||
      recent[2] === MarketRegimeType.STRONG_BULL ||
      recent[2] === MarketRegimeType.RECOVERY;
    const wasBear =
      recent[0] === MarketRegimeType.BEAR ||
      recent[0] === MarketRegimeType.STRONG_BEAR ||
      recent[0] === MarketRegimeType.WEAK_BEAR;

    if (isBullShift && wasBear) {
      types.push(TransitionType.EMERGING_BULL);
    }

    const isBearShift =
      recent[2] === MarketRegimeType.BEAR ||
      recent[2] === MarketRegimeType.STRONG_BEAR ||
      recent[2] === MarketRegimeType.CORRECTION;
    const wasBull =
      recent[0] === MarketRegimeType.BULL ||
      recent[0] === MarketRegimeType.STRONG_BULL ||
      recent[0] === MarketRegimeType.WEAK_BULL;

    if (isBearShift && wasBull) {
      types.push(TransitionType.EMERGING_BEAR);
    }

    return types;
  }

  detectVolatilityChanges(volatilityHistory: number[]): TransitionType[] {
    const types: TransitionType[] = [];
    if (volatilityHistory.length < 3) return types;

    const recent = volatilityHistory.slice(-3);
    if (recent[2] > recent[0] * 1.5) {
      types.push(TransitionType.VOLATILITY_EXPANSION);
    }
    if (recent[2] < recent[0] * 0.6) {
      types.push(TransitionType.VOLATILITY_CONTRACTION);
    }

    return types;
  }

  getTransitionHistory(transitions: RegimeTransition[]): RegimeTransition[] {
    return [...transitions].sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );
  }

  private getTransitionIndicators(from: MarketRegimeType, to: MarketRegimeType): string[] {
    const indicators: string[] = [];

    if (
      (from === MarketRegimeType.BEAR || from === MarketRegimeType.STRONG_BEAR) &&
      (to === MarketRegimeType.RECOVERY || to === MarketRegimeType.WEAK_BULL)
    ) {
      indicators.push('Fiyat toparlanmasi');
      indicators.push('Hacim artisi');
    }

    if (
      (from === MarketRegimeType.BULL || from === MarketRegimeType.STRONG_BULL) &&
      (to === MarketRegimeType.CORRECTION || to === MarketRegimeType.DISTRIBUTION)
    ) {
      indicators.push('Fiyat dususu');
      indicators.push('Kar alimlari');
    }

    if (indicators.length === 0) {
      indicators.push('Trend degisikligi');
    }

    return indicators;
  }
}
