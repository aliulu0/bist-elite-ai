import { Injectable, Logger, Optional } from '@nestjs/common';
import { ScorePipeline } from './score-pipeline.service';
import { ScoreRegistry } from './score-registry.service';
import {
  ScoreEngineInput,
  ScoreEngineOutput,
  ScorePipelineInput,
  StrategyWeightProfile,
} from './scoring-types';

@Injectable()
export class ScoreEngine {
  private readonly logger = new Logger(ScoreEngine.name);

  constructor(
    private readonly pipeline: ScorePipeline,
    private readonly registry: ScoreRegistry,
  ) {}

  async score(input: ScoreEngineInput): Promise<ScoreEngineOutput> {
    const profile = this.registry.getWeightProfile(input.strategyId);
    if (!profile) {
      throw new Error(
        `Strateji bulunamadı: ${input.strategyId}. Mevcut stratejiler için /scoring/strategies kullanın.`,
      );
    }

    const pipelineInput: ScorePipelineInput = input.pipelineInput;

    const pipelineOutput = await this.pipeline.run(pipelineInput, profile.weights);

    this.logger.log(
      `Puanlama tamamlandı [${input.ticker}][${profile.strategyId}]: AI=${pipelineOutput.aiResult.aiScore}, Güven=${pipelineOutput.aiResult.aiConfidence}`,
    );

    return {
      ticker: input.ticker,
      strategyId: input.strategyId,
      strategyName: profile.strategyName,
      scoredAt: new Date().toISOString(),
      pipeline: pipelineOutput,
    };
  }

  async scoreBatch(
    inputs: ScoreEngineInput[],
  ): Promise<ScoreEngineOutput[]> {
    const results: ScoreEngineOutput[] = [];
    const promises = inputs.map(async (input) => {
      try {
        const result = await this.score(input);
        results.push(result);
      } catch (error) {
        this.logger.warn(
          `Puanlama hatası ${input.ticker}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
    await Promise.all(promises);
    return results;
  }

  getWeightProfile(strategyId: string): StrategyWeightProfile | null {
    return this.registry.getWeightProfile(strategyId);
  }

  listStrategies(): StrategyWeightProfile[] {
    return this.registry.listWeightProfiles();
  }
}