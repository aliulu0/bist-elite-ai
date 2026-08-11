import { Injectable } from '@nestjs/common';
import { CompanyResearchResult } from './interfaces/agent-reach.types';

@Injectable()
export class ResearchRepository {
  private readonly companyResearch = new Map<string, CompanyResearchResult>();

  async setCompanyResearch(ticker: string, result: CompanyResearchResult): Promise<void> {
    this.companyResearch.set(ticker.toUpperCase(), result);
  }

  async getCompanyResearch(ticker: string): Promise<CompanyResearchResult | undefined> {
    return this.companyResearch.get(ticker.toUpperCase());
  }

  async getAllCompanyResearch(): Promise<CompanyResearchResult[]> {
    return Array.from(this.companyResearch.values());
  }

  async clear(): Promise<void> {
    this.companyResearch.clear();
  }
}
