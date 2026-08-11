import { Injectable } from '@nestjs/common';
import { CatalystResultDto, CatalystDashboardDto } from './interfaces/verification.types';

@Injectable()
export class CatalystRepository {
  private readonly catalysts = new Map<string, CatalystResultDto[]>();
  private dashboard: CatalystDashboardDto | null = null;

  async setCatalysts(ticker: string, results: CatalystResultDto[]): Promise<void> {
    this.catalysts.set(ticker.toUpperCase(), results);
  }

  async getCatalysts(ticker: string): Promise<CatalystResultDto[] | undefined> {
    return this.catalysts.get(ticker.toUpperCase());
  }

  async getAllCatalysts(): Promise<CatalystResultDto[]> {
    return Array.from(this.catalysts.values()).flat();
  }

  async getDashboard(): Promise<{ catalysts: CatalystResultDto[] } | undefined> {
    return this.dashboard ? { catalysts: this.dashboard.catalysts } : undefined;
  }

  async setDashboard(dashboard: CatalystDashboardDto): Promise<void> {
    this.dashboard = dashboard;
  }

  async clear(): Promise<void> {
    this.catalysts.clear();
    this.dashboard = null;
  }
}
