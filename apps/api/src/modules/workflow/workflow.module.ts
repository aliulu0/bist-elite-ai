import { Module } from '@nestjs/common';
import { WorkflowEngine } from './workflow.engine';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { EventBusModule } from '../event-bus/event-bus.module';
import { PerformanceMonitorModule } from '../performance-monitor/performance-monitor.module';

@Module({
  imports: [EventBusModule, PerformanceMonitorModule],
  controllers: [WorkflowController],
  providers: [WorkflowEngine, WorkflowService],
  exports: [WorkflowEngine, WorkflowService],
})
export class WorkflowModule {}
