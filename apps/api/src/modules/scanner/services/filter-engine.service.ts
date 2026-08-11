import { Injectable } from '@nestjs/common';
import { OpportunityResult } from '../../opportunity-detection/opportunity-detection.types';
import { ScannerFilterConfig, FilterStats } from '../scanner.types';

export interface FilterResult {
  passed: boolean;
  rejectionReason: string | null;
}

@Injectable()
export class FilterEngine {
  private readonly stats: FilterStats = this.buildInitialStats();

  constructor(private readonly config: ScannerFilterConfig) {}

  filter(opportunities: OpportunityResult[]): FilterResult[] {
    this.resetStats();
    this.stats.totalBefore = opportunities.length;
    const results = opportunities.map((opp) => this.evaluateFilter(opp));
    this.stats.totalAfter = results.filter((r) => r.passed).length;
    this.stats.totalFiltered = this.stats.totalBefore - this.stats.totalAfter;
    return results;
  }

  evaluateFilter(opportunity: OpportunityResult): FilterResult {
    const { opportunityScore, confidence, priority, age, confirmationLevel, opportunityTypes, risks, warnings, metadata } = opportunity;

    if (opportunityScore < this.config.minOpportunityScore) {
      this.stats.filteredByScore++;
      return { passed: false, rejectionReason: `Score ${opportunityScore} < min ${this.config.minOpportunityScore}` };
    }
    if (opportunityScore > this.config.maxOpportunityScore) {
      this.stats.filteredByScore++;
      return { passed: false, rejectionReason: `Score ${opportunityScore} > max ${this.config.maxOpportunityScore}` };
    }
    if (confidence < this.config.minConfidence) {
      this.stats.filteredByConfidence++;
      return { passed: false, rejectionReason: `Confidence ${confidence} < min ${this.config.minConfidence}` };
    }
    const risk = this.calculateRisk(risks, warnings);
    if (risk > this.config.maxRisk) {
      this.stats.filteredByRisk++;
      return { passed: false, rejectionReason: `Risk ${risk} > max ${this.config.maxRisk}` };
    }
    if (this.config.allowedOpportunityTypes.length > 0) {
      const hasAllowedType = opportunityTypes.some((t) => this.config.allowedOpportunityTypes.includes(t));
      if (!hasAllowedType) {
        this.stats.filteredByType++;
        return { passed: false, rejectionReason: `No matching type in [${this.config.allowedOpportunityTypes.join(', ')}]` };
      }
    }
    if (this.config.allowedSectors.length > 0 && metadata.aggregationQuality > 0) {
      // Sector check if available in metadata
    }
    const liquidityScore = metadata.aggregationQuality ?? 0;
    if (this.config.minLiquidity > 0 && liquidityScore < this.config.minLiquidity) {
      this.stats.filteredByLiquidity++;
      return { passed: false, rejectionReason: `Liquidity ${liquidityScore} < min ${this.config.minLiquidity}` };
    }
    if (this.config.maxVolatility < 100) {
      const volatility = this.calculateVolatility(warnings);
      if (volatility > this.config.maxVolatility) {
        this.stats.filteredByVolatility++;
        return { passed: false, rejectionReason: `Volatility ${volatility} > max ${this.config.maxVolatility}` };
      }
    }
    if (this.config.minQualityScore > 0 && metadata.aggregationQuality < this.config.minQualityScore) {
      this.stats.filteredByQuality++;
      return { passed: false, rejectionReason: `Quality ${metadata.aggregationQuality} < min ${this.config.minQualityScore}` };
    }
    if (this.config.minAggregationConfidence > 0 && metadata.providerConfidence < this.config.minAggregationConfidence) {
      this.stats.filteredByQuality++;
      return { passed: false, rejectionReason: `Aggregation confidence ${metadata.providerConfidence} < min ${this.config.minAggregationConfidence}` };
    }
    if (!this.config.allowedPriorityLevels.includes(priority)) {
      this.stats.filteredByPriority++;
      return { passed: false, rejectionReason: `Priority ${priority} not in [${this.config.allowedPriorityLevels.join(', ')}]` };
    }
    if (!this.config.allowedAgeStatuses.includes(age)) {
      this.stats.filteredByAge++;
      return { passed: false, rejectionReason: `Age ${age} not in [${this.config.allowedAgeStatuses.join(', ')}]` };
    }
    if (!this.config.allowedConfirmationLevels.includes(confirmationLevel)) {
      this.stats.filteredByConfirmation++;
      return { passed: false, rejectionReason: `Confirmation ${confirmationLevel} not in [${this.config.allowedConfirmationLevels.join(', ')}]` };
    }

    return { passed: true, rejectionReason: null };
  }

  getStats(): FilterStats {
    return { ...this.stats };
  }

  private calculateRisk(risks: string[], warnings: string[]): number {
    return Math.min(100, risks.length * 15 + warnings.length * 10);
  }

  private calculateVolatility(warnings: string[]): number {
    let vol = 0;
    for (const w of warnings) {
      if (w.toLowerCase().includes('volatil') || w.toLowerCase().includes('volatile')) vol += 20;
      if (w.toLowerCase().includes('unstable')) vol += 15;
    }
    return Math.min(100, vol);
  }

  private resetStats(): void {
    const s = this.stats;
    s.totalBefore = 0;
    s.totalAfter = 0;
    s.filteredByScore = 0;
    s.filteredByConfidence = 0;
    s.filteredByRisk = 0;
    s.filteredByType = 0;
    s.filteredBySector = 0;
    s.filteredByLiquidity = 0;
    s.filteredByMarketCap = 0;
    s.filteredByVolatility = 0;
    s.filteredByQuality = 0;
    s.filteredByPriority = 0;
    s.filteredByAge = 0;
    s.filteredByConfirmation = 0;
    s.totalFiltered = 0;
  }

  private buildInitialStats(): FilterStats {
    return {
      totalBefore: 0,
      totalAfter: 0,
      filteredByScore: 0,
      filteredByConfidence: 0,
      filteredByRisk: 0,
      filteredByType: 0,
      filteredBySector: 0,
      filteredByLiquidity: 0,
      filteredByMarketCap: 0,
      filteredByVolatility: 0,
      filteredByQuality: 0,
      filteredByPriority: 0,
      filteredByAge: 0,
      filteredByConfirmation: 0,
      totalFiltered: 0,
    };
  }
}
