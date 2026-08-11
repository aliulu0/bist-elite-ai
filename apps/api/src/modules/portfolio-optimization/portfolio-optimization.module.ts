import { Module } from '@nestjs/common';
import { PortfolioOptimizationEngine } from './portfolio-optimization.engine';
import { PortfolioOptimizationRegistry } from './portfolio-optimization.registry';
import { PortfolioOptimizationService } from './portfolio-optimization.service';
import { PortfolioOptimizationController } from './portfolio-optimization.controller';
import { AnalystModule } from '../analyst/analyst.module';
import { DecisionModule } from '../decision/decision.module';
import { OpportunityModule } from '../ai-opportunity/opportunity.module';
import { EliteScoreModule } from '../ai-elite-score/elite-score.module';
import { TomorrowModule } from '../tomorrow/tomorrow.module';
import { ResearchModule } from '../research/research.module';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [
    MarketDataModule,
    AnalystModule,
    DecisionModule,
    OpportunityModule,
    EliteScoreModule,
    TomorrowModule,
    ResearchModule,
  ],
  controllers: [PortfolioOptimizationController],
  providers: [
    PortfolioOptimizationEngine,
    PortfolioOptimizationRegistry,
    PortfolioOptimizationService,
  ],
  exports: [PortfolioOptimizationEngine, PortfolioOptimizationRegistry, PortfolioOptimizationService],
})
export class PortfolioOptimizationModule {}