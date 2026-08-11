import { Injectable } from '@nestjs/common';
import { AnalystInput, AnalystResult } from './analyst.types';
import { AnalystExplanationEngine } from './analyst-explanation.engine';

@Injectable()
export class AnalystEngine {
  constructor(
    private readonly explanationEngine: AnalystExplanationEngine,
  ) {}

  evaluate(input: AnalystInput): AnalystResult {
    return this.explanationEngine.generate(input);
  }
}