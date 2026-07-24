import { Injectable, Logger } from '@nestjs/common';
import { IDataProvider } from './interfaces';

@Injectable()
export class MarketDataProviderRegistry {
  private readonly logger = new Logger(MarketDataProviderRegistry.name);
  private readonly providers = new Map<string, IDataProvider>();

  register(provider: IDataProvider): void {
    if (this.providers.has(provider.name)) {
      this.logger.warn(`Provider "${provider.name}" is already registered. Overwriting.`);
    }
    this.providers.set(provider.name, provider);
    this.logger.log(`Provider "${provider.name}" registered.`);
  }

  unregister(name: string): boolean {
    const removed = this.providers.delete(name);
    if (removed) {
      this.logger.log(`Provider "${name}" unregistered.`);
    }
    return removed;
  }

  get(name: string): IDataProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): IDataProvider[] {
    return Array.from(this.providers.values());
  }

  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async getActiveProvider(): Promise<IDataProvider | undefined> {
    for (const provider of this.providers.values()) {
      try {
        const healthy = await provider.validateConnection();
        if (healthy) return provider;
      } catch {
        continue;
      }
    }
    return undefined;
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.validateConnection();
      } catch {
        results[name] = false;
      }
    }
    return results;
  }
}
