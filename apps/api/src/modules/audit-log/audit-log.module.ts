import { Module } from '@nestjs/common';
import { AuditLogEngine } from './audit-log.engine';
import { EventBusModule } from '../event-bus/event-bus.module';

@Module({
  imports: [EventBusModule],
  providers: [AuditLogEngine],
  exports: [AuditLogEngine],
})
export class AuditLogModule {}
