import { Injectable, Logger } from '@nestjs/common';
import { PortfolioOptimizationEngine } from './portfolio-optimization.engine';
import { PortfolioOptimizationRegistry } from './portfolio-optimization.registry';
import { AnalystService } from '../analyst/analyst.service';
import { DecisionRegistry } from '../decision/decision-registry.service';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { EliteScoreService } from '../ai-elite-score/elite-score.service';
import { TomorrowService } from '../tomorrow/tomorrow.service';
import { VerificationRepository } from '../research/verification-repository.service';
import { ResearchIntelligenceService } from '../research/research-intelligence.service';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';
import {
  PortfolioOptimizationInput,
  PortfolioOptimizationResult,
} from './portfolio-optimization.types';

@Injectable()
export class PortfolioOptimizationService {
  private readonly logger = new Logger(PortfolioOptimizationService.name);

  constructor(
    private readonly engine: PortfolioOptimizationEngine,
    private readonly registry: PortfolioOptimizationRegistry,
    private readonly analystService: AnalystService,
    private readonly decisionRegistry: DecisionRegistry,
    private readonly opportunityRegistry: OpportunityRegistry,
    private readonly eliteScoreService: EliteScoreService,
    private readonly tomorrowService: TomorrowService,
    private readonly verificationRepository: VerificationRepository,
    private readonly researchIntelligence: ResearchIntelligenceService,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  async optimize(ticker: string): Promise<PortfolioOptimizationResult | null> {
    const cached = this.registry.get(ticker);
    if (cached) {
      return cached.result;
    }

    const symbol = this.symbolRegistry.getSymbol(ticker);

    let analystResult: any = null;
    let decisionResult: any = null;
    let opportunityResult: any = null;
    let eliteScoreResult: any = null;
    let tomorrowResult: any = null;
    let verificationResult: any = null;
    let catalysts: any[] = [];

    try {
      analystResult = await this.analystService.getByTicker(ticker);
    } catch {
      analystResult = null;
    }

    try {
      const decisionEntry = this.decisionRegistry.get(ticker);
      decisionResult = decisionEntry?.result ?? null;
    } catch {
      decisionResult = null;
    }

    try {
      const opportunityEntry = this.opportunityRegistry.get(ticker);
      opportunityResult = opportunityEntry?.result ?? null;
    } catch {
      opportunityResult = null;
    }

    try {
      eliteScoreResult = this.eliteScoreService.getByTicker(ticker);
    } catch {
      eliteScoreResult = null;
    }

    try {
      tomorrowResult = this.tomorrowService.getByTicker(ticker);
    } catch {
      tomorrowResult = null;
    }

    try {
      verificationResult =
        (await this.verificationRepository.getVerificationResult(ticker)) ?? null;
    } catch {
      verificationResult = null;
    }

    try {
      const research = await this.researchIntelligence.getCompanyResearch(ticker);
      catalysts = (research?.catalysts ?? []).map((c) => ({
        id: c.id,
        ticker: c.ticker ?? ticker,
        title: c.title,
        importance: c.importance,
        verification: c.verification,
      }));
    } catch {
      catalysts = [];
    }

    const input: PortfolioOptimizationInput = {
      ticker,
      company: symbol?.companyName ?? ticker,
      analystResult,
      decisionResult,
      opportunityResult,
      eliteScoreResult,
      tomorrowResult,
      verificationResult,
      catalysts,
      indicators: [],
      sector: null,
    };

    const result = this.engine.optimize(input);
    this.registry.set({
      ticker,
      input,
      result,
      evaluatedAt: result.evaluatedAt,
    });

    return result;
  }

  async getByTicker(ticker: string): Promise<PortfolioOptimizationResult> {
    const result = await this.optimize(ticker);
    if (!result) {
      throw new Error(
        `Portföy optimizasyonu hesaplanamadı: ${ticker}. Sembol bilinmiyor veya veri yok.`,
      );
    }
    return result;
  }

  async top(limit = 10): Promise<PortfolioOptimizationResult[]> {
    let tickers = this.symbolRegistry
      .getActiveSymbols()
      .slice(0, 40)
      .map((s) => s.canonicalTicker);
    for (const ticker of tickers) {
      await this.optimize(ticker);
    }
    return this.registry.top(limit);
  }
}