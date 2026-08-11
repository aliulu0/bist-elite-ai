import {
  AiProviderCategory,
  AiProviderConfig,
  AiProviderName,
  AiProviderResult,
  AiProviderStatus,
  ResearchBundle,
} from '../ai-research.types';

export interface IAiResearchProvider {
  readonly name: AiProviderName;
  readonly category: AiProviderCategory;
  isEnabled(): boolean;
  getConfig(): AiProviderConfig;
  getStatus(): AiProviderStatus;
  collect(bundle: ResearchBundle): Promise<AiProviderResult>;
}

export const AI_RESEARCH_PROVIDERS_TOKEN = 'AI_RESEARCH_PROVIDERS';
