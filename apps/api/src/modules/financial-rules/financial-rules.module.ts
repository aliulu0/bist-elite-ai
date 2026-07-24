import { Module } from '@nestjs/common';
import { FinancialRulesEngine } from './financial-rules-engine.service';
import {
  PriceToBookRule,
  EvToEbitdaRule,
  NetProfitGrowthRule,
  EquityGrowthRule,
  DebtRatioRule,
  SectorComparisonRule,
} from './rules';

const rules = [
  PriceToBookRule,
  EvToEbitdaRule,
  NetProfitGrowthRule,
  EquityGrowthRule,
  DebtRatioRule,
  SectorComparisonRule,
];

const providers = [...rules, FinancialRulesEngine];

@Module({
  providers,
  exports: providers,
})
export class FinancialRulesModule {}
