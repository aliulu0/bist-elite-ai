import { Injectable } from '@nestjs/common';
import { BaseAiResearchProvider } from './base-ai-provider';
import { getProviderConfig } from '../ai-research.config';
import { AiEvidenceItem, ResearchBundle } from '../ai-research.types';

@Injectable()
export class GeminiProvider extends BaseAiResearchProvider {
  constructor() {
    super(getProviderConfig('gemini'));
  }

  protected collectEvidence(_bundle: ResearchBundle): AiEvidenceItem[] {
    return [];
  }
}
