import { Injectable, Logger } from '@nestjs/common';
import { FinancialData, FinancialRulesOutput, RuleResult } from './rule.types';
import {
  PriceToBookRule,
  EvToEbitdaRule,
  NetProfitGrowthRule,
  EquityGrowthRule,
  DebtRatioRule,
  SectorComparisonRule,
} from './rules';

@Injectable()
export class FinancialRulesEngine {
  private readonly logger = new Logger(FinancialRulesEngine.name);

  constructor(
    private readonly priceToBookRule: PriceToBookRule,
    private readonly evToEbitdaRule: EvToEbitdaRule,
    private readonly netProfitGrowthRule: NetProfitGrowthRule,
    private readonly equityGrowthRule: EquityGrowthRule,
    private readonly debtRatioRule: DebtRatioRule,
    private readonly sectorComparisonRule: SectorComparisonRule,
  ) {}

  evaluate(data: FinancialData): FinancialRulesOutput {
    const rules: RuleResult[] = [];

    rules.push(this.priceToBookRule.evaluate(data));
    rules.push(this.evToEbitdaRule.evaluate(data));
    rules.push(this.netProfitGrowthRule.evaluate(data));
    rules.push(this.equityGrowthRule.evaluate(data));
    rules.push(this.debtRatioRule.evaluate(data));
    rules.push(this.sectorComparisonRule.evaluate(data));

    this.logger.debug(
      `Evaluated ${rules.length} rules for ${data.symbol}: ` +
        `${rules.filter((r) => r.status === 'PASS').length} PASS, ` +
        `${rules.filter((r) => r.status === 'WARNING').length} WARNING, ` +
        `${rules.filter((r) => r.status === 'FAIL').length} FAIL`,
    );

    return {
      symbol: data.symbol,
      rules,
    };
  }
}
