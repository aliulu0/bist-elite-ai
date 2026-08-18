import { Module } from '@nestjs/common';
import { EarlyOpportunityModule } from '../early-opportunity.module';
import { MarketDataModule } from '../../market-data/market-data.module';
import { RadarService } from './radar.service';
import { RadarController } from './radar.controller';
import { RadarEventEmitter } from './radar.events';

/**
 * R2-048 — Live Opportunity Monitoring & Radar Engine module.
 *
 * Reuses the existing EarlyOpportunity intelligence pipeline, incremental market
 * data, symbol registry, cache and dedup — no new provider/cache/indicator layer.
 */
@Module({
  imports: [EarlyOpportunityModule, MarketDataModule],
  controllers: [RadarController],
  providers: [RadarService, RadarEventEmitter],
  exports: [RadarService, RadarEventEmitter],
})
export class RadarModule {}
