import { Module, Global } from '@nestjs/common';
import { RegimeDetectorService } from './regime-detector.service';
import { RegimeTransitionService } from './regime-transition.service';
import { RegimeHistoricalService } from './regime-historical.service';
import { RegimeContextService } from './regime-context.service';
import { RegimeReportGeneratorService } from './regime-report-generator.service';
import { MarketRegimeOrchestratorService } from './market-regime-orchestrator.service';

const providers = [
  RegimeDetectorService,
  RegimeTransitionService,
  RegimeHistoricalService,
  RegimeContextService,
  RegimeReportGeneratorService,
  MarketRegimeOrchestratorService,
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class MarketRegimeModule {}
