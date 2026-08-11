import { PipelineInput, ModuleResult } from '../ai-analysis.types';

export interface IAnalysisModule {
  readonly name: string;
  readonly weight: number;
  readonly enabled: boolean;
  analyze(input: PipelineInput): Promise<ModuleResult>;
}
