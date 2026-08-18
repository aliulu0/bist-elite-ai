import { Module, forwardRef } from '@nestjs/common';
import { PredictionModule } from '../prediction/prediction.module';
import { AIResearchHubModule } from '../ai-research/ai-research.module';
import { EliteScoreModule } from '../ai-elite-score/elite-score.module';
import { OpportunityModule } from '../ai-opportunity/opportunity.module';
import { DecisionModule } from '../decision/decision.module';
import { SymbolRegistryModule } from '../market-data/symbol-registry/symbol-registry.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { SmartMoneyModule } from '../smart-money/smart-money.module';
import { CatalystModule } from '../catalyst/catalyst.module';
import { VerificationAIModule } from '../verification-ai/verification-ai.module';
import { EntryModule } from '../entry/entry.module';
import { BacktestModule } from '../backtest/backtest.module';
import { FinancialRulesModule } from '../financial-rules/financial-rules.module';
import { EarlyOpportunityEngine } from './early-opportunity.engine';
import { EarlyOpportunityIntelligenceEngine } from './early-opportunity.intelligence-engine';
import { EarlyOpportunityService } from './early-opportunity.service';
import { EarlyOpportunityIntelligenceService } from './early-opportunity.intelligence.service';
import { EarlyOpportunityIntelligenceController } from './early-opportunity.controller';
import { MultiTimeframeOpportunityEngine } from './multi-timeframe/multi-timeframe-engine';
import { MultiTimeframeOpportunityService } from './multi-timeframe/multi-timeframe.service';
import { MultiTimeframeOpportunityController } from './multi-timeframe/multi-timeframe.controller';
import { MarketOverviewController } from './market-overview.controller';
import { WatchlistController } from './watchlist.controller';
import { SearchController } from './search.controller';
import { TopListsController } from './top-lists.controller';
import { DashboardPerformanceController } from './dashboard-performance.controller';
import { SelfLearningEngine } from './self-learning/self-learning.engine';
import { SelfLearningRegistry } from './self-learning/self-learning.registry';
import { SelfLearningService } from './self-learning/self-learning.service';
import { EarlySignalScannerEngine } from './signals/early-signal-scanner.engine';
import { EarlySignalScannerService } from './signals/early-signal-scanner.service';
import { SignalsController } from './signals/signals.controller';
import { EarlyOpportunityDecisionEngine } from './decision/early-opportunity-decision.engine';
import { EarlyOpportunityDecisionService } from './decision/early-opportunity-decision.service';
import { EarlyOpportunityDecisionController } from './decision/early-opportunity-decision.controller';

@Module({
  imports: [
    PredictionModule,
    AIResearchHubModule,
    EliteScoreModule,
    OpportunityModule,
    DecisionModule,
    SymbolRegistryModule,
    MarketDataModule,
    SmartMoneyModule,
    CatalystModule,
    VerificationAIModule,
    EntryModule,
    BacktestModule,
    FinancialRulesModule,
  ],
  controllers: [
    EarlyOpportunityIntelligenceController,
    MultiTimeframeOpportunityController,
    MarketOverviewController,
    WatchlistController,
    SearchController,
    TopListsController,
    DashboardPerformanceController,
    SignalsController,
    EarlyOpportunityDecisionController,
  ],
  providers: [
    EarlyOpportunityEngine,
    EarlyOpportunityIntelligenceEngine,
    EarlyOpportunityService,
    EarlyOpportunityIntelligenceService,
    MultiTimeframeOpportunityEngine,
    MultiTimeframeOpportunityService,
    EarlySignalScannerEngine,
    EarlySignalScannerService,
    SelfLearningEngine,
    SelfLearningRegistry,
    SelfLearningService,
    EarlyOpportunityDecisionEngine,
    EarlyOpportunityDecisionService,
  ],
  exports: [
    EarlyOpportunityEngine,
    EarlyOpportunityIntelligenceEngine,
    EarlyOpportunityService,
    EarlyOpportunityIntelligenceService,
    MultiTimeframeOpportunityEngine,
    MultiTimeframeOpportunityService,
    SelfLearningEngine,
    SelfLearningRegistry,
    SelfLearningService,
    EarlyOpportunityDecisionEngine,
    EarlyOpportunityDecisionService,
    EarlySignalScannerService,
  ],
})
export class EarlyOpportunityModule {}
