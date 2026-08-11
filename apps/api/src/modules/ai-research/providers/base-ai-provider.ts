import { Logger } from '@nestjs/common';
import {
  AiEvidenceItem,
  AiProviderCategory,
  AiProviderConfig,
  AiProviderName,
  AiProviderResult,
  AiProviderStatus,
  ResearchBundle,
} from '../ai-research.types';

export abstract class BaseAiResearchProvider {
  protected readonly logger: Logger;
  protected lastSync: string | null = null;
  protected totalRequests = 0;

  constructor(protected readonly config: AiProviderConfig) {
    this.logger = new Logger(this.constructor.name);
  }

  get name(): AiProviderName {
    return this.config.name;
  }

  get category(): AiProviderCategory {
    return this.config.category;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfig(): AiProviderConfig {
    return this.config;
  }

  getStatus(): AiProviderStatus {
    return {
      name: this.name,
      category: this.category,
      enabled: this.isEnabled(),
      status: this.lastSync ? 'ok' : 'idle',
      lastSync: this.lastSync,
      totalRequests: this.totalRequests,
    };
  }

  async collect(bundle: ResearchBundle): Promise<AiProviderResult> {
    this.totalRequests++;
    if (!this.isEnabled()) {
      return {
        provider: this.name,
        category: this.category,
        status: 'disabled',
        summary: '',
        items: [],
        collectedAt: new Date().toISOString(),
      };
    }

    try {
      const items = await this.collectEvidence(bundle);
      this.lastSync = new Date().toISOString();
      const summary = this.buildSummary(bundle, items);
      return {
        provider: this.name,
        category: this.category,
        status: items.length > 0 ? 'success' : 'empty',
        summary,
        items,
        collectedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Provider ${this.name} collect failed: ${message}`);
      return {
        provider: this.name,
        category: this.category,
        status: 'error',
        summary: '',
        items: [],
        error: message,
        collectedAt: new Date().toISOString(),
      };
    }
  }

  protected abstract collectEvidence(bundle: ResearchBundle): AiEvidenceItem[] | Promise<AiEvidenceItem[]>;

  protected buildSummary(_bundle: ResearchBundle, items: AiEvidenceItem[]): string {
    if (items.length === 0) return '';
    return items[0].title;
  }

  protected hashId(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}
