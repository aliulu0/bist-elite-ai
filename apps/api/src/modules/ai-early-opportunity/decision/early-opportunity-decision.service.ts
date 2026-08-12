import { forwardRef, Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { EarlyOpportunityIntelligenceService } from '../early-opportunity.intelligence.service';
import { EarlyOpportunityIntelligenceResult } from '../early-opportunity.types';
import { EarlyOpportunityDecisionEngine } from './early-opportunity-decision.engine';
import { EarlyOpportunityDecision } from './early-opportunity-decision.types';

const DECISION_CONCURRENCY = 12;

/**
 * R2-045 — Early Opportunity Decision service.
 *
 * Standalone `evaluate(ticker)` runs the full intelligence pipeline (including
 * multi-timeframe) and then decides. Batch `enrichWithDecisions` reuses the
 * already-built intelligence results without extra provider calls.
 */
@Injectable()
export class EarlyOpportunityDecisionService {
  private readonly logger = new Logger(EarlyOpportunityDecisionService.name);

  constructor(
    @Optional() @Inject(forwardRef(() => EarlyOpportunityIntelligenceService))
    private readonly intelligenceService?: EarlyOpportunityIntelligenceService,
    private readonly engine: EarlyOpportunityDecisionEngine = new EarlyOpportunityDecisionEngine(),
  ) {}

  async evaluate(ticker: string): Promise<EarlyOpportunityDecision> {
    if (!this.intelligenceService) {
      throw new Error('EarlyOpportunityIntelligenceService is not available.');
    }
    const result = await this.intelligenceService.getEarlyOpportunity(ticker);
    if (!result) {
      throw new NotFoundException(`'${ticker}' için analiz sonucu bulunamadı.`);
    }
    if (result.decision) return result.decision;
    return this.engine.decide(result);
  }

  async enrichWithDecisions(results: EarlyOpportunityIntelligenceResult[]): Promise<void> {
    await this.mapWithConcurrency(
      results,
      DECISION_CONCURRENCY,
      async (r) => {
        r.decision = this.engine.decide(r);
      },
    );
  }

  async decideFor(result: EarlyOpportunityIntelligenceResult): Promise<EarlyOpportunityDecision> {
    return this.engine.decide(result);
  }

  private async mapWithConcurrency<TItem>(
    items: TItem[],
    concurrency: number,
    fn: (item: TItem, index: number) => Promise<void>,
  ): Promise<void> {
    let i = 0;
    const worker = async () => {
      while (true) {
        const index = i;
        i += 1;
        if (index >= items.length) return;
        await fn(items[index], index);
      }
    };
    const workers = Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker(),
    );
    await Promise.all(workers);
  }
}
