import { Module } from '@nestjs/common';
import { Optional } from '@nestjs/common';
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

const alertServices = [
  CooldownEngine,
  DuplicatePrevention,
  AlertHistory,
  AlertMetricsCollector,
  TelegramService,
  TelegramDailyRadarService,
  TelegramClient,
  TelegramMessageFormatter,
  TelegramDeliveryRepository,
  WebSocketPublisher,
  WatchlistManager,
  TriggerEvaluator,
];

@Module({
  imports: [RadarModule],
  controllers: [AlertsController, WatchlistController, TelegramDailyRadarController],
  providers: [
    AlertEngine,
    TelegramDailyRadarService,
    TelegramService,
    TelegramClient,
    TelegramMessageFormatter,
    TelegramDeliveryRepository,
    {
      provide: WebSocketPublisher,
      useClass: WebSocketPublisher,
    },
    {
      provide: WatchlistManager,
      useClass: WatchlistManager,
    },
    {
      provide: TriggerEvaluator,
      useClass: TriggerEvaluator,
    },
  ],
  exports: [AlertEngine, TelegramDailyRadarService, TelegramService],
})
export class AlertsModule {}