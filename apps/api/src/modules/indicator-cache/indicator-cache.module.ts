import { Module } from '@nestjs/common';
import { IndicatorsModule } from '../indicators/indicators.module';
import { IndicatorCacheService } from './indicator-cache.service';
import { RegistryCacheAdapter } from './registry-cache.adapter';

@Module({
  imports: [IndicatorsModule],
  providers: [IndicatorCacheService, RegistryCacheAdapter],
  exports: [IndicatorCacheService, RegistryCacheAdapter],
})
export class IndicatorCacheModule {}
