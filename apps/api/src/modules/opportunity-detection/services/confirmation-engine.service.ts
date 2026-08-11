import { Injectable } from '@nestjs/common';
import { ConfirmationLevel, ConfirmationRecord, DetectionModuleResult } from '../opportunity-detection.types';
import { ConfirmationConfig } from '../opportunity-detection.config';

@Injectable()
export class ConfirmationEngine {
  calculate(
    moduleResults: DetectionModuleResult[],
    config: ConfirmationConfig,
  ): { level: ConfirmationLevel; count: number; records: ConfirmationRecord[] } {
    const confirmingModules = moduleResults.filter(
      (m) => m.score >= config.singleThreshold && m.confidence > 50,
    );

    const count = confirmingModules.length;

    const records: ConfirmationRecord[] = confirmingModules.map((m) => ({
      module: m.module,
      timestamp: new Date().toISOString(),
      score: m.score,
      signal: m.strengths[0] ?? '',
    }));

    const level = this.determineLevel(count, config);

    return { level, count, records };
  }

  private determineLevel(count: number, config: ConfirmationConfig): ConfirmationLevel {
    if (count >= config.multiThreshold) return 'MULTI';
    if (count >= config.tripleThreshold) return 'TRIPLE';
    if (count >= config.doubleThreshold) return 'DOUBLE';
    if (count >= config.minModulesForConfirmation) return 'SINGLE';
    return 'NONE';
  }

  getConfirmationScore(level: ConfirmationLevel): number {
    const scores: Record<ConfirmationLevel, number> = {
      NONE: 0,
      SINGLE: 20,
      DOUBLE: 40,
      TRIPLE: 60,
      MULTI: 80,
    };
    return scores[level];
  }
}
