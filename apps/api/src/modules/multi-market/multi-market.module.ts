import { Module } from '@nestjs/common';
import { MultiMarketController } from './multi-market.controller';
import { MultiMarketService } from './multi-market.service';

@Module({
  controllers: [MultiMarketController],
  providers: [MultiMarketService],
  exports: [MultiMarketService],
})
export class MultiMarketModule {}
