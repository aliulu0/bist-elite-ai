import { Injectable } from '@nestjs/common';
import {
  ExplanationInput,
  RiskFactor,
  RiskType,
  RiskSeverity,
  TrendDirection,
  MomentumState,
  Timeframe,
  TIMEFRAME_ORDER,
} from './types';
import { getRiskDescription } from './turkish-terms';

@Injectable()
export class RiskAnalyzer {
  analyze(input: ExplanationInput): RiskFactor[] {
    const risks: RiskFactor[] = [];

    risks.push(this.analyzeTrendRisk(input));
    risks.push(this.analyzeVolatilityRisk(input));
    risks.push(this.analyzeLiquidityRisk(input));
    risks.push(this.analyzeFalseBreakoutRisk(input));
    risks.push(this.analyzeFalseSignalRisk(input));
    risks.push(this.analyzeTimeframeConflict(input));
    risks.push(this.analyzeMarketUncertainty(input));

    if (input.riskFactors) {
      for (const external of input.riskFactors) {
        if (!risks.find(r => r.type === external.type)) {
          risks.push(external);
        }
      }
    }

    return risks;
  }

  getOverallRiskLevel(risks: RiskFactor[]): RiskSeverity {
    const criticalCount = risks.filter(r => r.severity === RiskSeverity.CRITICAL).length;
    const highCount = risks.filter(r => r.severity === RiskSeverity.HIGH).length;
    const mediumCount = risks.filter(r => r.severity === RiskSeverity.MEDIUM).length;

    if (criticalCount > 0) return RiskSeverity.CRITICAL;
    if (highCount >= 2) return RiskSeverity.HIGH;
    if (highCount >= 1 && mediumCount >= 2) return RiskSeverity.HIGH;
    if (mediumCount >= 2) return RiskSeverity.MEDIUM;
    if (mediumCount >= 1) return RiskSeverity.MEDIUM;
    return RiskSeverity.LOW;
  }

  private analyzeTrendRisk(input: ExplanationInput): RiskFactor {
    let severity = RiskSeverity.LOW;
    let score = 0;

    if (input.technicalScore?.trend !== undefined) {
      const trend = input.technicalScore.trend;
      if (trend < 30) {
        severity = RiskSeverity.HIGH;
        score = 0.8;
      } else if (trend < 45) {
        severity = RiskSeverity.MEDIUM;
        score = 0.5;
      } else if (trend >= 70) {
        severity = RiskSeverity.LOW;
        score = 0.2;
      } else {
        severity = RiskSeverity.LOW;
        score = 0.3;
      }
    }

    if (input.timeframeData) {
      const directions = Object.values(input.timeframeData)
        .map(tf => tf.trend)
        .filter((d): d is TrendDirection => d !== undefined);

      const hasConflict = this.hasDirectionConflict(directions);
      if (hasConflict) {
        severity = RiskSeverity.MEDIUM;
        score = Math.max(score, 0.5);
      }
    }

    return {
      type: RiskType.TREND_RISK,
      severity,
      score,
      description: getRiskDescription(RiskType.TREND_RISK, severity),
      indicators: ['trend_analysis', 'timeframe_alignment'],
    };
  }

  private analyzeVolatilityRisk(input: ExplanationInput): RiskFactor {
    let severity = RiskSeverity.LOW;
    let score = 0;

    if (input.technicalScore?.volatility !== undefined) {
      const volatility = input.technicalScore.volatility;
      if (volatility >= 80) {
        severity = RiskSeverity.HIGH;
        score = 0.85;
      } else if (volatility >= 60) {
        severity = RiskSeverity.MEDIUM;
        score = 0.55;
      } else {
        severity = RiskSeverity.LOW;
        score = 0.25;
      }
    }

    const atrIndicator = input.indicators?.find(i => i.indicator === 'ATR');
    if (atrIndicator && atrIndicator.value > 3) {
      severity = RiskSeverity.HIGH;
      score = Math.max(score, 0.75);
    }

    return {
      type: RiskType.VOLATILITY_RISK,
      severity,
      score,
      description: getRiskDescription(RiskType.VOLATILITY_RISK, severity),
      indicators: ['ATR', 'volatility'],
    };
  }

  private analyzeLiquidityRisk(input: ExplanationInput): RiskFactor {
    let severity = RiskSeverity.LOW;
    let score = 0.2;

    if (input.indicators) {
      const volumeIndicator = input.indicators.find(i => i.indicator === 'Volume' || i.indicator === 'OBV');
      if (volumeIndicator && !volumeIndicator.isPositive) {
        severity = RiskSeverity.MEDIUM;
        score = 0.5;
      }
    }

    if (input.technicalScore?.volume !== undefined && input.technicalScore.volume < 30) {
      severity = RiskSeverity.HIGH;
      score = 0.7;
    }

    return {
      type: RiskType.LIQUIDITY_RISK,
      severity,
      score,
      description: getRiskDescription(RiskType.LIQUIDITY_RISK, severity),
      indicators: ['volume', 'OBV', 'market_depth'],
    };
  }

  private analyzeFalseBreakoutRisk(input: ExplanationInput): RiskFactor {
    let severity = RiskSeverity.LOW;
    let score = 0.3;

    const bbIndicator = input.indicators?.find(i => i.indicator === 'BollingerBands');
    if (bbIndicator) {
      if (bbIndicator.value > 0.9 || bbIndicator.value < 0.1) {
        severity = RiskSeverity.MEDIUM;
        score = 0.55;
      }
    }

    if (input.technicalScore?.momentum !== undefined && input.technicalScore?.trend !== undefined) {
      const momentumStrong = input.technicalScore.momentum >= 70;
      const trendWeak = input.technicalScore.trend < 40;
      if (momentumStrong && trendWeak) {
        severity = RiskSeverity.HIGH;
        score = 0.7;
      }
    }

    return {
      type: RiskType.FALSE_BREAKOUT_RISK,
      severity,
      score,
      description: getRiskDescription(RiskType.FALSE_BREAKOUT_RISK, severity),
      indicators: ['BollingerBands', 'support_resistance'],
    };
  }

  private analyzeFalseSignalRisk(input: ExplanationInput): RiskFactor {
    let severity = RiskSeverity.LOW;
    let score = 0.3;

    if (input.indicators && input.indicators.length > 0) {
      const positiveCount = input.indicators.filter(i => i.isPositive).length;
      const negativeCount = input.indicators.filter(i => !i.isPositive).length;
      const total = input.indicators.length;

      const disagreement = Math.abs(positiveCount - negativeCount) / total;
      if (disagreement < 0.2) {
        severity = RiskSeverity.HIGH;
        score = 0.7;
      } else if (disagreement < 0.4) {
        severity = RiskSeverity.MEDIUM;
        score = 0.5;
      }
    }

    return {
      type: RiskType.FALSE_SIGNAL_RISK,
      severity,
      score,
      description: getRiskDescription(RiskType.FALSE_SIGNAL_RISK, severity),
      indicators: ['multiple_indicators'],
    };
  }

  private analyzeTimeframeConflict(input: ExplanationInput): RiskFactor {
    let severity = RiskSeverity.LOW;
    let score = 0.2;

    if (input.timeframeData) {
      const directions = Object.values(input.timeframeData)
        .map(tf => tf.trend)
        .filter((d): d is TrendDirection => d !== undefined);

      if (directions.length >= 2) {
        const hasConflict = this.hasDirectionConflict(directions);
        if (hasConflict) {
          const conflictCount = this.countDirectionConflicts(directions);
          if (conflictCount >= 3) {
            severity = RiskSeverity.HIGH;
            score = 0.75;
          } else if (conflictCount >= 2) {
            severity = RiskSeverity.MEDIUM;
            score = 0.5;
          } else {
            severity = RiskSeverity.MEDIUM;
            score = 0.4;
          }
        }
      }
    }

    return {
      type: RiskType.TIMEFRAME_CONFLICT,
      severity,
      score,
      description: getRiskDescription(RiskType.TIMEFRAME_CONFLICT, severity),
      indicators: ['multi_timeframe'],
    };
  }

  private analyzeMarketUncertainty(input: ExplanationInput): RiskFactor {
    let severity = RiskSeverity.LOW;
    let score = 0.3;

    if (input.confidenceScore) {
      if (input.confidenceScore.composite < 0.3) {
        severity = RiskSeverity.HIGH;
        score = 0.7;
      } else if (input.confidenceScore.composite < 0.5) {
        severity = RiskSeverity.MEDIUM;
        score = 0.5;
      }
    }

    const adxIndicator = input.indicators?.find(i => i.indicator === 'ADX');
    if (adxIndicator && adxIndicator.value < 20) {
      severity = RiskSeverity.HIGH;
      score = Math.max(score, 0.65);
    }

    return {
      type: RiskType.MARKET_UNCERTAINTY,
      severity,
      score,
      description: getRiskDescription(RiskType.MARKET_UNCERTAINTY, severity),
      indicators: ['ADX', 'market_regime'],
    };
  }

  private hasDirectionConflict(directions: TrendDirection[]): boolean {
    const uptrends = directions.filter(d =>
      d === TrendDirection.STRONG_UPTREND || d === TrendDirection.UPTREND || d === TrendDirection.WEAK_UPTREND,
    );
    const downtrends = directions.filter(d =>
      d === TrendDirection.STRONG_DOWNTREND || d === TrendDirection.DOWNTREND || d === TrendDirection.WEAK_DOWNTREND,
    );
    return uptrends.length > 0 && downtrends.length > 0;
  }

  private countDirectionConflicts(directions: TrendDirection[]): number {
    let conflicts = 0;
    for (let i = 0; i < directions.length; i++) {
      for (let j = i + 1; j < directions.length; j++) {
        const a = directions[i];
        const b = directions[j];
        const aIsUp = a === TrendDirection.STRONG_UPTREND || a === TrendDirection.UPTREND || a === TrendDirection.WEAK_UPTREND;
        const bIsUp = b === TrendDirection.STRONG_UPTREND || b === TrendDirection.UPTREND || b === TrendDirection.WEAK_UPTREND;
        const aIsDown = a === TrendDirection.STRONG_DOWNTREND || a === TrendDirection.DOWNTREND || a === TrendDirection.WEAK_DOWNTREND;
        const bIsDown = b === TrendDirection.STRONG_DOWNTREND || b === TrendDirection.DOWNTREND || b === TrendDirection.WEAK_DOWNTREND;
        if ((aIsUp && bIsDown) || (aIsDown && bIsUp)) {
          conflicts++;
        }
      }
    }
    return conflicts;
  }
}
