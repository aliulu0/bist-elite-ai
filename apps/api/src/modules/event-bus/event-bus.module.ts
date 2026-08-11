import { Module } from '@nestjs/common';
import { EventBusEngine } from './event-bus.engine';
import { EventBusService } from './event-bus.service';
import { EventBusController } from './event-bus.controller';

@Module({
  providers: [EventBusEngine, EventBusService],
  controllers: [EventBusController],
  exports: [EventBusEngine, EventBusService],
})
export class EventBusModule {}
