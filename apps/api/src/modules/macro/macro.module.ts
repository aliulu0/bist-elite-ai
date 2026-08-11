import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { MacroController } from './macro.controller';
import { MacroService } from './macro.service';
import { MacroDataService } from './macro-data.service';
import { MacroAnalysisService } from './macro-analysis.service';
import { CentralBankNlpEngine } from './engines/central-bank-nlp.engine';
import { MarketRegimeEngine } from './engines/market-regime.engine';
import { MacroScoreEngine } from './engines/macro-score.engine';
import { SectorImpactEngine } from './engines/sector-impact.engine';
import { CombinedConfidenceEngine } from './engines/combined-confidence.engine';
import { TCMBDecisionAnalyzer } from './engines/tcmb-decision-analyzer';
import { TCMBDecisionStoreService } from './tcmb-decision-store.service';
import { ConsoleDecisionNotifier, DECISION_NOTIFIER, IDecisionNotifier } from './decision-notifier';
import { MacroEliteScoreService } from './macro-elite-score.service';
import { CombinedConfidenceService } from './combined-confidence.service';
import { TCMBDecisionCaptureService } from './tcmb-decision-capture.service';

@Module({
  imports: [MarketDataModule],
  controllers: [MacroController],
  providers: [
    MacroService,
    MacroDataService,
    MacroAnalysisService,
    CentralBankNlpEngine,
    MarketRegimeEngine,
    MacroScoreEngine,
    SectorImpactEngine,
    CombinedConfidenceEngine,
    TCMBDecisionAnalyzer,
    TCMBDecisionStoreService,
    ConsoleDecisionNotifier,
    { provide: DECISION_NOTIFIER, useExisting: ConsoleDecisionNotifier },
    MacroEliteScoreService,
    CombinedConfidenceService,
    TCMBDecisionCaptureService,
  ],
  exports: [
    MacroService,
    MacroDataService,
    MacroAnalysisService,
    MacroScoreEngine,
    MarketRegimeEngine,
    CombinedConfidenceEngine,
    TCMBDecisionAnalyzer,
    TCMBDecisionStoreService,
    MacroEliteScoreService,
    CombinedConfidenceService,
    TCMBDecisionCaptureService,
  ],
})
export class MacroModule {}
