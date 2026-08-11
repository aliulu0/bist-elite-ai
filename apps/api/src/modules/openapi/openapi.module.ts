import { Module } from '@nestjs/common';
import { OpenAPIEngine } from './openapi.service';
import { EventBusModule } from '../event-bus/event-bus.module';

@Module({
  imports: [EventBusModule],
  providers: [OpenAPIEngine],
  exports: [OpenAPIEngine],
})
export class OpenAPIModule {}
