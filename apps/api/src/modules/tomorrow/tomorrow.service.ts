import { Injectable, NotFoundException } from '@nestjs/common';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { OpportunityEngine } from '../ai-opportunity/opportunity-engine.service';
import { EliteScoreService } from '../ai-elite-score/elite-score.service';
import { EliteScoreRegistry } from '../ai-elite-score/elite-score.registry';
import { EliteScoreEngine } from '../ai-elite-score/elite-score.engine';
import { toDecisionInput, DecisionInputDto } from '../decision/decision.dto';
import { NIGHT_ANALYSIS_WINDOW } from './tomorrow.config';
import { TomorrowOpportunityEngine } from './tomorrow.engine';
import { TomorrowRegistry } from './tomorrow.registry';
import { TomorrowCandidateResult, TomorrowInput } from './tomorrow.types';

@Injectable()
export class TomorrowService {
  constructor(
    private readonly engine: TomorrowOpportunityEngine,
    private readonly registry: TomorrowRegistry,
    private readonly opportunityRegistry: OpportunityRegistry,
    private readonly eliteScoreService: EliteScoreService,
    private readonly eliteScoreRegistry: EliteScoreRegistry,
    private readonly opportunityEngine: OpportunityEngine,
    private readonly eliteScoreEngine: EliteScoreEngine,
  ) {}

  sync(): void {
    this.eliteScoreService.sync();
    for (const entry of this.opportunityRegistry.getAll()) {
      const elite = this.eliteScoreRegistry.get(entry.ticker)?.result ?? null;
      if (!elite) {
        continue;
      }
      const input: TomorrowInput = { opportunity: entry.result, elite };
      const result = this.engine.evaluate(input);
      this.registry.set({
        ticker: entry.ticker,
        input,
        result,
        evaluatedAt: result.evaluatedAt,
      });
    }
  }

  getByTicker(ticker: string): TomorrowCandidateResult {
    this.sync();
    const entry = this.registry.get(ticker);
    if (!entry) {
      throw new NotFoundException(
        `Yarın fırsatı bulunamadı: ${ticker}. Önce bir tarama çalıştırın veya /tomorrow/batch kullanın.`,
      );
    }
    return entry.result;
  }

  top(limit: number = 100): TomorrowCandidateResult[] {
    this.sync();
    return this.registry.top(limit);
  }

  evaluateBatch(items: DecisionInputDto[]): TomorrowCandidateResult[] {
    const results: TomorrowCandidateResult[] = [];
    for (const item of items) {
      const input = toDecisionInput(item);
      const opportunity = this.opportunityEngine.evaluate(input);
      const elite = this.eliteScoreEngine.evaluate(opportunity);
      const tomorrow = this.engine.evaluate({ opportunity, elite });
      this.registry.set({
        ticker: tomorrow.ticker,
        input: { opportunity, elite },
        result: tomorrow,
        evaluatedAt: tomorrow.evaluatedAt,
      });
      results.push(tomorrow);
    }
    return results;
  }

  nightAnalysisWindow() {
    return NIGHT_ANALYSIS_WINDOW;
  }
}
