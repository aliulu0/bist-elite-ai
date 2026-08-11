import { Module } from '@nestjs/common';
import { FinancialRulesEngine } from './financial-rules-engine.service';
import { FinancialScoreEngine } from './financial-score-engine.service';
import { FinancialSummaryGenerator } from './financial-summary-generator.service';
import { FinancialAnalysisService } from './financial-analysis.service';
import { FinancialAnalysisController } from './financial-analysis.controller';
import { FundamentalValidationService } from './fundamental-validation.service';
import { FundamentalIntegrationService } from './fundamental-integration.service';
import { FinancialDataQualityService } from './financial-data-quality.service';
import { MarketDataModule } from '../market-data/market-data.module';
import { SymbolRegistryModule } from '../market-data/symbol-registry/symbol-registry.module';
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

const providers = [
  ...rules,
  FinancialRulesEngine,
  FinancialScoreEngine,
  FinancialSummaryGenerator,
  FinancialAnalysisService,
  FundamentalValidationService,
  FundamentalIntegrationService,
  FinancialDataQualityService,
];

@Module({
  imports: [MarketDataModule, SymbolRegistryModule],
  controllers: [FinancialAnalysisController],
  providers,
  exports: providers,
})
export class FinancialRulesModule {}
