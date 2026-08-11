import { Injectable } from '@nestjs/common';
import { CombinedConfidenceResult } from './macro-elite.types';

@Injectable()
export class CombinedConfidenceService {
  calculate(
    eliteConfidence: number,
    macroConfidence: number,
    weights?: { weightElite?: number; weightMacro?: number },
  ): CombinedConfidenceResult {
    const wElite = weights?.weightElite ?? 0.5;
    const wMacro = weights?.weightMacro ?? 0.5;
    const eliteNorm = eliteConfidence <= 1 ? eliteConfidence * 100 : eliteConfidence;

    const combined = Math.round(
      Math.max(0, Math.min(100, eliteNorm * wElite + macroConfidence * wMacro)),
    );

    return {
      eliteConfidence: Math.round(eliteNorm * 10) / 10,
      macroConfidence,
      combined,
      weightElite: wElite,
      weightMacro: wMacro,
      calculatedAt: new Date().toISOString(),
    };
  }
}
