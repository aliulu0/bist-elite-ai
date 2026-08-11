import { Injectable } from '@nestjs/common';
import { VerificationResult, VerificationDashboardDto } from './interfaces/verification.types';

@Injectable()
export class VerificationRepository {
  private readonly results = new Map<string, VerificationResult>();
  private dashboard: VerificationDashboardDto | null = null;

  async setVerificationResult(ticker: string, result: VerificationResult): Promise<void> {
    this.results.set(ticker.toUpperCase(), result);
  }

  async getVerificationResult(ticker: string): Promise<VerificationResult | undefined> {
    return this.results.get(ticker.toUpperCase());
  }

  async getAllResults(): Promise<VerificationResult[]> {
    return Array.from(this.results.values());
  }

  async setDashboard(dashboard: VerificationDashboardDto): Promise<void> {
    this.dashboard = dashboard;
  }

  async getDashboard(): Promise<VerificationDashboardDto | undefined> {
    return this.dashboard ?? undefined;
  }

  async clear(): Promise<void> {
    this.results.clear();
    this.dashboard = null;
  }
}
