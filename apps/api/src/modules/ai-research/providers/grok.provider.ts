import { Injectable } from '@nestjs/common';
import { BaseAiResearchProvider } from './base-ai-provider';
import { getProviderConfig } from '../ai-research.config';
import { AiEvidenceItem, ResearchBundle } from '../ai-research.types';

@Injectable()
export class GrokProvider extends BaseAiResearchProvider {
  constructor() {
    super(getProviderConfig('grok'));
  }

  protected collectEvidence(_bundle: ResearchBundle): AiEvidenceItem[] {
    return [];
  }
}
