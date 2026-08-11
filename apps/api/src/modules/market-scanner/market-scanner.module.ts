import { Module } from '@nestjs/common';
import { MarketScannerEngine } from './market-scanner.engine';
import { ScannerService } from './scanner.service';

@Module({
  controllers: [],
  providers: [MarketScannerEngine, ScannerService],
  exports: [MarketScannerEngine, ScannerService],
})
export class MarketScannerModule {}
