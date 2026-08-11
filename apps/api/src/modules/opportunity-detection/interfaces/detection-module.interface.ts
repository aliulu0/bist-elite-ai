import { AnalysisResult } from '../../ai-analysis/ai-analysis.types';
import { DetectionModuleResult } from '../opportunity-detection.types';

export interface IDetectionModule {
  readonly name: string;
  readonly weight: number;
  readonly enabled: boolean;
  detect(input: AnalysisResult): DetectionModuleResult;
}
