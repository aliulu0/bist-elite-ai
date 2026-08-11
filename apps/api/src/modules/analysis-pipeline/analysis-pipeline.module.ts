import { Module } from '@nestjs/common';
import { AnalysisPipelineOrchestrator } from './analysis-pipeline.orchestrator';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { MarketDataModule } from '../market-data/market-data.module';
import { IndicatorsModule } from '../indicators/indicators.module';
import { MarketStructureModule } from '../market-structure/market-structure.module';
import { SmartMoneyModule } from '../smart-money/smart-money.module';
import { TechnicalRulesModule } from '../technical-rules/technical-rules.module';
import { TechnicalScoreModule } from '../technical-score/technical-score.module';
import { TechnicalSummaryModule } from '../technical-summary/technical-summary.module';
import { FinancialRulesModule } from '../financial-rules/financial-rules.module';
import { ConfluenceModule } from '../confluence/confluence.module';
import { CandidateModule } from '../candidate/candidate.module';
import { OpportunityModule } from '../opportunity/opportunity.module';
import { EliteScoreModule } from '../elite-score/elite-score.module';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [
    MarketDataModule,
    IndicatorsModule,
    MarketStructureModule,
    SmartMoneyModule,
    TechnicalRulesModule,
    TechnicalScoreModule,
    TechnicalSummaryModule,
    FinancialRulesModule,
    ConfluenceModule,
    CandidateModule,
    OpportunityModule,
    EliteScoreModule,
    PersistenceModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisPipelineOrchestrator, AnalysisService],
  exports: [AnalysisPipelineOrchestrator, AnalysisService],
})
export class AnalysisPipelineModule {}
