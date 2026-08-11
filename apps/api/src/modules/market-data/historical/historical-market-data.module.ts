import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data.module';
import { HistoricalMarketDataController } from './historical-market-data.controller';
import { HistoricalMarketDataService } from './historical-market-data.service';

@Module({
  imports: [MarketDataModule],
  controllers: [HistoricalMarketDataController],
  providers: [HistoricalMarketDataService],
  exports: [HistoricalMarketDataService],
})
export class HistoricalMarketDataModule {}
