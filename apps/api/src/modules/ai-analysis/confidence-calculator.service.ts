import { Injectable } from '@nestjs/common';
import { ModuleResult, PipelineInput } from './ai-analysis.types';
import { AggregationMetadata } from '../market-data/aggregation/aggregation.types';

export interface ConfidenceFactors {
  aggregationQuality: number;
  providerAgreement: number;
  missingDataPenalty: number;
  dataFreshness: number;
  validationWarningPenalty: number;
  moduleConfidenceAverage: number;
}

@Injectable()
export class ConfidenceCalculator {
  calculate(
    moduleResults: ModuleResult[],
    input: PipelineInput,
    aggregationMetadata?: AggregationMetadata,
  ): number {
    const factors = this.calculateFactors(moduleResults, input, aggregationMetadata);
    const raw =
      factors.aggregationQuality * 0.25 +
      factors.providerAgreement * 0.20 +
      factors.dataFreshness * 0.15 +
      factors.moduleConfidenceAverage * 0.25 -
      factors.missingDataPenalty * 0.10 -
      factors.validationWarningPenalty * 0.05;

    return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
  }

  calculateFactors(
    moduleResults: ModuleResult[],
    input: PipelineInput,
    aggregationMetadata?: AggregationMetadata,
  ): ConfidenceFactors {
    return {
      aggregationQuality: this.scoreAggregationQuality(aggregationMetadata),
      providerAgreement: this.scoreProviderAgreement(aggregationMetadata),
      missingDataPenalty: this.scoreMissingData(input),
      dataFreshness: this.scoreDataFreshness(input),
      validationWarningPenalty: this.scoreValidationWarnings(aggregationMetadata),
      moduleConfidenceAverage: this.scoreModuleConfidence(moduleResults),
    };
  }

  private scoreAggregationQuality(metadata?: AggregationMetadata): number {
    if (!metadata) return 30;
    return Math.min(100, metadata.qualityScore);
  }

  private scoreProviderAgreement(metadata?: AggregationMetadata): number {
    if (!metadata) return 30;
    const used = metadata.providersUsed.length;
    const queried = metadata.providersQueried.length;
    if (queried === 0) return 0;
    const agreementRatio = used / queried;
    return Math.round(agreementRatio * 100);
  }

  private scoreMissingData(input: PipelineInput): number {
    let missing = 0;
    let total = 0;

    total++;
    if (input.company) total++; else missing++;

    if (input.incomeStatement) total++; else missing++;
    if (input.balanceSheet) total++; else missing++;
    if (input.cashFlow) total++; else missing++;

    if (total === 0) return 100;
    return Math.round((missing / total) * 100);
  }

  private scoreDataFreshness(input: PipelineInput): number {
    const sources = [
      input.company?.metadata?.lastUpdated,
      input.incomeStatement?.metadata?.lastUpdated,
      input.balanceSheet?.metadata?.lastUpdated,
      input.cashFlow?.metadata?.lastUpdated,
    ].filter(Boolean);

    if (sources.length === 0) return 30;

    const now = Date.now();
    const maxAge = Math.max(
      ...sources.map((ts) => {
        const age = now - new Date(ts!).getTime();
        return Math.max(0, age);
      }),
    );

    const oneDay = 24 * 60 * 60 * 1000;
    if (maxAge < oneDay) return 100;
    if (maxAge < 7 * oneDay) return 80;
    if (maxAge < 30 * oneDay) return 60;
    if (maxAge < 90 * oneDay) return 40;
    return 20;
  }

  private scoreValidationWarnings(metadata?: AggregationMetadata): number {
    if (!metadata) return 0;
    return Math.min(100, metadata.validationWarnings.length * 10);
  }

  private scoreModuleConfidence(moduleResults: ModuleResult[]): number {
    if (moduleResults.length === 0) return 0;
    const sum = moduleResults.reduce((acc, r) => acc + r.confidence, 0);
    return Math.round((sum / moduleResults.length) * 100) / 100;
  }
}
