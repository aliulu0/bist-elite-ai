import { Injectable } from '@nestjs/common';
import { ProviderHealthMonitorEngine } from './provider-health-monitor.engine';
import { ProviderName, ProviderRequestRecord } from './provider-health-monitor.types';

@Injectable()
export class ProviderHealthMonitorService {
  constructor(private readonly engine: ProviderHealthMonitorEngine) {}

  getSnapshot() {
    return this.engine.getSnapshot();
  }

  getProviderState(provider: ProviderName) {
    return this.engine.getProviderState(provider);
  }

  getRequestHistory(provider: ProviderName, limit: number, offset: number): { requests: ProviderRequestRecord[]; total: number } {
    const all = this.engine.getRequestHistory(provider);
    const total = all.length;
    const requests = all.slice(offset, offset + limit);
    return { requests, total };
  }

  resetAll(): void {
    this.engine.resetAll();
  }

  resetProvider(provider: ProviderName): void {
    this.engine.resetProvider(provider);
  }
}
