import { Module } from '@nestjs/common';
import { ConfigurationEngine } from './configuration.engine';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';
import { EventBusModule } from '../event-bus/event-bus.module';

@Module({
  imports: [EventBusModule],
  providers: [ConfigurationEngine, ConfigurationService],
  controllers: [ConfigurationController],
  exports: [ConfigurationEngine, ConfigurationService],
})
export class ConfigurationModule {}
