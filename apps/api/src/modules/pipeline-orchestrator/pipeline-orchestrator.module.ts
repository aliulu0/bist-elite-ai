import { Module } from '@nestjs/common';
import { PipelineOrchestratorService } from './pipeline-orchestrator.service';
import { PipelineOrchestratorController } from './pipeline-orchestrator.controller';
import { WorkflowModule } from '../workflow/workflow.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { AnalysisPipelineModule } from '../analysis-pipeline/analysis-pipeline.module';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';
import { OpportunityDetectionModule } from '../opportunity-detection/opportunity-detection.module';
import { ScannerModule } from '../scanner/scanner.module';
import { RankingModule } from '../ranking/ranking.module';
import { AlertsModule } from '../alerts/alerts.module';
import { MacroModule } from '../macro/macro.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { WebSocketGatewayModule } from '../websocket-gateway/websocket-gateway.module';

@Module({
  imports: [
    WorkflowModule,
    MarketDataModule,
    AnalysisPipelineModule,
    AiAnalysisModule,
    OpportunityDetectionModule,
    ScannerModule,
    RankingModule,
    AlertsModule,
    MacroModule,
    PortfolioModule,
    WebSocketGatewayModule,
  ],
  controllers: [PipelineOrchestratorController],
  providers: [PipelineOrchestratorService],
  exports: [PipelineOrchestratorService],
})
export class PipelineOrchestratorModule {}
