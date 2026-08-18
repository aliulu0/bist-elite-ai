import { Module } from '@nestjs/common';
import { MarketScannerEngine } from './market-scanner.engine';
import { ScannerService } from './scanner.service';
import { DailyMarketScanService } from './daily-market-scan.service';
import { DailyScanController } from './daily-scan.controller';
import { OpportunityRadarService } from './opportunity-radar.service';
import { DailyScanNotifierService } from './daily-scan.notifier.service';
import { TelegramClient } from '../alerts/telegram-client';
import { MarketDataModule } from '../market-data/market-data.module';
import { AnalysisPipelineModule } from '../analysis-pipeline/analysis-pipeline.module';

@Module({
  imports: [MarketDataModule, AnalysisPipelineModule],
  controllers: [DailyScanController],
  providers: [
    MarketScannerEngine,
    ScannerService,
    DailyMarketScanService,
    OpportunityRadarService,
    DailyScanNotifierService,
    TelegramClient,
  ],
  exports: [
    MarketScannerEngine,
    ScannerService,
    DailyMarketScanService,
    OpportunityRadarService,
    DailyScanNotifierService,
  ],
})
export class MarketScannerModule {}
