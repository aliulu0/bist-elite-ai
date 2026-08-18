import { Injectable } from '@nestjs/common';
import { CombinedConfidence, MacroConfig } from '../macro.types';
import { DEFAULT_MACRO_CONFIG } from '../macro.config';

@Injectable()
export class CombinedConfidenceEngine {
  private readonly config: MacroConfig;

  constructor() {
    this.config = { ...DEFAULT_MACRO_CONFIG };
  }

  calculate(
    eliteScore: number,
    macroScore: number | null,
    weightElite?: number,
    weightMacro?: number,
  ): CombinedConfidence {
    const wElite = weightElite ?? this.config.combinedConfidence.defaultWeightElite;
    const wMacro = weightMacro ?? this.config.combinedConfidence.defaultWeightMacro;
    const combined =
      macroScore === null ? null : Math.round(eliteScore * wElite + macroScore * wMacro);

    return {
      eliteScore,
      macroScore,
      combined,
      weightElite: wElite,
      weightMacro: wMacro,
      calculatedAt: new Date().toISOString(),
    };
  }
}
