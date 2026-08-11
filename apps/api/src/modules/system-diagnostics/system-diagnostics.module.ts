import { Module } from '@nestjs/common';
import { SystemDiagnosticsEngine } from './system-diagnostics.engine';
import { EventBusModule } from '../event-bus/event-bus.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [EventBusModule, AuditLogModule],
  providers: [SystemDiagnosticsEngine],
  exports: [SystemDiagnosticsEngine],
})
export class SystemDiagnosticsModule {}
