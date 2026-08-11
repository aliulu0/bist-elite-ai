import { Module } from '@nestjs/common';
import { ProviderHealthMonitorEngine } from './provider-health-monitor.engine';
import { ProviderHealthMonitorService } from './provider-health-monitor.service';
import { ProviderHealthMonitorController } from './provider-health-monitor.controller';

@Module({
  providers: [ProviderHealthMonitorEngine, ProviderHealthMonitorService],
  controllers: [ProviderHealthMonitorController],
  exports: [ProviderHealthMonitorEngine, ProviderHealthMonitorService],
})
export class ProviderHealthMonitorModule {}
