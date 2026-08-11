import { Module } from '@nestjs/common';
import { IndicatorCacheModule } from '../indicator-cache/indicator-cache.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { PerformanceMetricsService } from './performance-metrics.service';
import { PerformanceMetricsController } from './performance-metrics.controller';

@Module({
  imports: [IndicatorCacheModule, MarketDataModule],
  providers: [PerformanceMetricsService],
  controllers: [PerformanceMetricsController],
  exports: [PerformanceMetricsService],
})
export class PerformanceMetricsModule {}
