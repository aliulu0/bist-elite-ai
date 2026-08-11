import { Inject, Injectable } from '@nestjs/common';
import {
  AiEvidenceItem,
  AiProviderName,
  AiProviderResult,
  AiProviderStatus,
  ResearchBundle,
} from './ai-research.types';
import { IAiResearchProvider, AI_RESEARCH_PROVIDERS_TOKEN } from './providers/ai-provider.interface';

@Injectable()
export class AIProviderRegistry {
  private readonly providers = new Map<AiProviderName, IAiResearchProvider>();

  constructor(@Inject(AI_RESEARCH_PROVIDERS_TOKEN) providers: IAiResearchProvider[]) {
    for (const provider of providers) {
      if (!this.providers.has(provider.name)) {
        this.providers.set(provider.name, provider);
      }
    }
  }

  register(provider: IAiResearchProvider): void {
    if (!this.providers.has(provider.name)) {
      this.providers.set(provider.name, provider);
    }
  }

  get(name: AiProviderName): IAiResearchProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): IAiResearchProvider[] {
    return Array.from(this.providers.values());
  }

  getEnabled(): IAiResearchProvider[] {
    return this.getAll().filter((provider) => provider.isEnabled());
  }

  getNames(): AiProviderName[] {
    return Array.from(this.providers.keys());
  }

  getStatus(): AiProviderStatus[] {
    return this.getAll().map((provider) => provider.getStatus());
  }

  async collectAll(bundle: ResearchBundle): Promise<AiProviderResult[]> {
    const enabled = this.getEnabled();
    const results = await Promise.all(enabled.map((provider) => provider.collect(bundle)));
    return results;
  }

  flatten(results: AiProviderResult[]): AiEvidenceItem[] {
    return results.flatMap((result) => result.items);
  }
}
