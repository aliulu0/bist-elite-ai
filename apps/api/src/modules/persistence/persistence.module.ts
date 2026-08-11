import { Module } from '@nestjs/common';
import { PersistenceService } from './persistence.service';
import { EventBusModule } from '../event-bus/event-bus.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PerformanceMonitorModule } from '../performance-monitor/performance-monitor.module';

@Module({
  imports: [EventBusModule, AuditLogModule, PerformanceMonitorModule],
  providers: [PersistenceService],
  exports: [PersistenceService],
})
export class PersistenceModule {}
