import { Module } from '@nestjs/common';
import { WorkflowQueueEngine } from './workflow-queue.engine';
import { WorkflowQueueService } from './workflow-queue.service';
import { WorkflowQueueController } from './workflow-queue.controller';
import { EventBusModule } from '../event-bus/event-bus.module';

@Module({
  imports: [EventBusModule],
  providers: [WorkflowQueueEngine, WorkflowQueueService],
  controllers: [WorkflowQueueController],
  exports: [WorkflowQueueEngine, WorkflowQueueService],
})
export class WorkflowQueueModule {}
