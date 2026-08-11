import { Module } from '@nestjs/common';
import { MarketStructureEngine } from './market-structure.engine';

@Module({
  providers: [MarketStructureEngine],
  exports: [MarketStructureEngine],
})
export class MarketStructureModule {}
