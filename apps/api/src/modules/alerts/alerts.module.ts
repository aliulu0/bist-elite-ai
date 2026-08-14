import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { WatchlistController } from './watchlist.controller';
import { AlertEngine } from './engine/alert-engine.service';
import { CooldownEngine } from './services/cooldown.service';
import { DuplicatePrevention } from './services/duplicate-prevention.service';
import { AlertHistory } from './services/alert-history.service';
import { AlertMetricsCollector } from './services/alert-metrics.service';
import { TelegramService } from './services/telegram.service';
import { TelegramDailyRadarService } from './telegram-daily-radar.service';
import { TelegramClient } from './telegram-client';
import { TelegramMessageFormatter } from './telegram-message.formatter';
import { TelegramDeliveryRepository } from './telegram-delivery.repository';
import { WebSocketPublisher } from './services/websocket.service';
import { WatchlistManager } from './services/watchlist-manager.service';
import { TriggerEvaluator } from './services/trigger-evaluator.service';
import { TelegramDailyRadarController } from './telegram-daily-radar.controller';
import { RadarModule } from '../ai-early-opportunity/radar/radar.module';

const preExistingAlertServices = [
  CooldownEngine,
  DuplicatePrevention,
  AlertHistory,
  AlertMetricsCollector,
  TelegramService,
  WebSocketPublisher,
  WatchlistManager,
  TriggerEvaluator,
];

@Module({
  imports: [RadarModule],
  controllers: [AlertsController, WatchlistController, TelegramDailyRadarController],
  providers: [
    AlertEngine,
    ...preExistingAlertServices.map((service) => ({
      provide: service,
      useFactory: () => new service(),
    })),
    TelegramDailyRadarService,
    TelegramClient,
    TelegramMessageFormatter,
    TelegramDeliveryRepository,
  ],
  exports: [AlertEngine, TelegramDailyRadarService, TelegramService, ...preExistingAlertServices],
})
export class AlertsModule {}