import { Module } from '@nestjs/common';
import { EarlyOpportunityModule } from '../ai-early-opportunity/early-opportunity.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { SymbolRegistryModule } from '../market-data/symbol-registry/symbol-registry.module';
import { BacktestModule } from '../backtest/backtest.module';
import { PortfolioIntelligenceEngine } from './portfolio-intelligence.engine';
import { PortfolioIntelligenceRegistry } from './portfolio-intelligence.registry';
import { PortfolioIntelligenceService } from './portfolio-intelligence.service';
import { PortfolioIntelligenceController } from './portfolio-intelligence.controller';

@Module({
  imports: [
    EarlyOpportunityModule,
    MarketDataModule,
    SymbolRegistryModule,
    BacktestModule,
  ],
  controllers: [PortfolioIntelligenceController],
  providers: [
    PortfolioIntelligenceEngine,
    PortfolioIntelligenceRegistry,
    PortfolioIntelligenceService,
  ],
  exports: [
    PortfolioIntelligenceEngine,
    PortfolioIntelligenceRegistry,
    PortfolioIntelligenceService,
  ],
})
export class PortfolioIntelligenceModule {}
