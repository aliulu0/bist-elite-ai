import { Injectable, NotFoundException } from '@nestjs/common';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { OpportunityEngine } from '../ai-opportunity/opportunity-engine.service';
import { toDecisionInput, DecisionInputDto } from '../decision/decision.dto';
import { EliteScoreEngine } from './elite-score.engine';
import { EliteScoreRegistry } from './elite-score.registry';
import { EliteScoreHorizon, EliteScoreResult } from './elite-score.types';

@Injectable()
export class EliteScoreService {
  constructor(
    private readonly engine: EliteScoreEngine,
    private readonly registry: EliteScoreRegistry,
    private readonly opportunityRegistry: OpportunityRegistry,
    private readonly opportunityEngine: OpportunityEngine,
  ) {}

  sync(): void {
    for (const entry of this.opportunityRegistry.getAll()) {
      const result = this.engine.evaluate(entry.result);
      this.registry.set({
        ticker: entry.ticker,
        input: entry.result,
        result,
        evaluatedAt: result.evaluatedAt,
      });
    }
  }

  getByTicker(ticker: string): EliteScoreResult {
    this.sync();
    const entry = this.registry.get(ticker);
    if (!entry) {
      throw new NotFoundException(
        `Elite skor bulunamadı: ${ticker}. Önce bir tarama çalıştırın veya /elite-score/batch kullanın.`,
      );
    }
    return entry.result;
  }

  top(limit: number = 100): EliteScoreResult[] {
    this.sync();
    return this.registry.top(limit);
  }

  rankedByHorizon(horizon: EliteScoreHorizon, limit: number = 100): EliteScoreResult[] {
    this.sync();
    return this.registry.rankedByHorizon(horizon, limit);
  }

  evaluateBatch(items: DecisionInputDto[]): EliteScoreResult[] {
    const results: EliteScoreResult[] = [];
    for (const item of items) {
      const input = toDecisionInput(item);
      const opportunity = this.opportunityEngine.evaluate(input);
      const result = this.engine.evaluate(opportunity);
      this.registry.set({
        ticker: result.ticker,
        input: opportunity,
        result,
        evaluatedAt: result.evaluatedAt,
      });
      results.push(result);
    }
    return results;
  }
}
