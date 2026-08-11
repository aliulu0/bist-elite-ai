import { Module } from '@nestjs/common';
import { WorkflowIntegrationService } from './workflow-integration.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { WorkflowQueueModule } from '../workflow-queue/workflow-queue.module';
import { EventBusModule } from '../event-bus/event-bus.module';
import { PerformanceMonitorModule } from '../performance-monitor/performance-monitor.module';

@Module({
  imports: [WorkflowModule, WorkflowQueueModule, EventBusModule, PerformanceMonitorModule],
  providers: [WorkflowIntegrationService],
  exports: [WorkflowIntegrationService],
})
export class WorkflowIntegrationModule {}
