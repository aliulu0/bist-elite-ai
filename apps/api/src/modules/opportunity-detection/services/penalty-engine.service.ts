import { Injectable } from '@nestjs/common';
import { DetectionModuleResult, PenaltyRecord } from '../opportunity-detection.types';
import { PenaltyConfig } from '../opportunity-detection.config';

@Injectable()
export class PenaltyEngine {
  calculate(
    moduleResults: DetectionModuleResult[],
    config: PenaltyConfig,
    aggregationQuality: number,
    providerConfidence: number,
  ): PenaltyRecord[] {
    const penalties: PenaltyRecord[] = [];

    if (aggregationQuality < 50) {
      penalties.push({
        type: 'LOW_AGGREGATION_QUALITY',
        amount: config.lowAggregationQualityPenalty,
        reason: `Aggregation quality ${aggregationQuality}% below threshold`,
        module: 'aggregation',
      });
    }

    if (providerConfidence < 50) {
      penalties.push({
        type: 'LOW_PROVIDER_CONFIDENCE',
        amount: config.lowProviderConfidencePenalty,
        reason: `Provider confidence ${providerConfidence}% below threshold`,
        module: 'provider',
      });
    }

    const hasFundamental = moduleResults.some((m) => m.module === 'fundamentalChange' && m.score > 40);
    if (!hasFundamental) {
      const noFundamentalData = moduleResults.some(
        (m) => m.warnings.some((w) => w.toLowerCase().includes('fundamental')),
      );
      if (noFundamentalData) {
        penalties.push({
          type: 'MISSING_FUNDAMENTALS',
          amount: config.missingFundamentalsPenalty,
          reason: 'No fundamental data available for opportunity assessment',
          module: 'fundamentalChange',
        });
      }
    }

    const positiveSignals = moduleResults.filter((m) => m.score > 60).length;
    const negativeSignals = moduleResults.filter((m) => m.score < 40).length;
    if (positiveSignals > 0 && negativeSignals > 0) {
      penalties.push({
        type: 'CONTRADICTING_INDICATORS',
        amount: config.contradictingIndicatorsPenalty,
        reason: `${positiveSignals} positive and ${negativeSignals} negative signals`,
        module: 'composite',
      });
    }

    const confirmations = moduleResults.filter((m) => m.score >= 60).length;
    if (confirmations < 2) {
      penalties.push({
        type: 'WEAK_CONFIRMATIONS',
        amount: config.weakConfirmationsPenalty,
        reason: `Only ${confirmations} confirming modules`,
        module: 'composite',
      });
    }

    const avgVolatility = moduleResults
      .filter((m) => m.module === 'volatilityCompression' || m.module === 'atrExpansion')
      .reduce((sum, m) => sum + m.score, 0) /
      Math.max(1, moduleResults.filter((m) => m.module === 'volatilityCompression' || m.module === 'atrExpansion').length);

    if (avgVolatility > 75) {
      penalties.push({
        type: 'HIGH_VOLATILITY',
        amount: config.highVolatilityPenalty,
        reason: `High volatility environment: ${Math.round(avgVolatility)}%`,
        module: 'volatility',
      });
    }

    return penalties;
  }
}
