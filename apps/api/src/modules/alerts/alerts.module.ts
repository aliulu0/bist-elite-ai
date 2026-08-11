import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { WatchlistController } from './watchlist.controller';
import { AlertEngine } from './engine/alert-engine.service';
import { CooldownEngine } from './services/cooldown.service';
import { DuplicatePrevention } from './services/duplicate-prevention.service';
import { AlertHistory } from './services/alert-history.service';
import { AlertMetricsCollector } from './services/alert-metrics.service';
import { TelegramService } from './services/telegram.service';
import { WebSocketPublisher } from './services/websocket.service';
import { WatchlistManager } from './services/watchlist-manager.service';
import { TriggerEvaluator } from './services/trigger-evaluator.service';

const alertServices = [
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
  controllers: [AlertsController, WatchlistController],
  providers: [
    AlertEngine,
    ...alertServices.map((service) => ({
      provide: service,
      useFactory: () => new service(),
    })),
  ],
  exports: [AlertEngine, ...alertServices],
})
export class AlertsModule {}
