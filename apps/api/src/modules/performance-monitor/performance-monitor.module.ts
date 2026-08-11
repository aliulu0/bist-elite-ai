import { Module } from '@nestjs/common';
import { PerformanceMonitorEngine } from './performance-monitor.engine';
import { PerformanceMonitorService } from './performance-monitor.service';
import { PerformanceMonitorController } from './performance-monitor.controller';

@Module({
  providers: [PerformanceMonitorEngine, PerformanceMonitorService],
  controllers: [PerformanceMonitorController],
  exports: [PerformanceMonitorEngine, PerformanceMonitorService],
})
export class PerformanceMonitorModule {}
