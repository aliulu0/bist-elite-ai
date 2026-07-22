# Changelog

## [1.0.0] - 2026-07-21

### Added
- Notification Engine core types and enums
- NotificationChannel: TELEGRAM, EMAIL, MOBILE_PUSH, WEB
- NotificationPriority: LOW, NORMAL, HIGH, CRITICAL
- EventType: ELITE_OPPORTUNITY, EARLY_OPPORTUNITY, PORTFOLIO_UPDATE, RISK_EVENT, BACKTEST_COMPLETE, SYSTEM_EVENT, APPLICATION_ERROR, DAILY_SUMMARY, WEEKLY_SUMMARY, MONTHLY_SUMMARY
- AlertType: INSTANT, SCHEDULED, DAILY_SUMMARY, WEEKLY_SUMMARY, MONTHLY_SUMMARY
- DeliveryStatus: PENDING, SENT, FAILED, CANCELLED, RETRYING, DEAD_LETTER
- NotificationStatus: CREATED, QUEUED, PROCESSING, DELIVERED, FAILED, CANCELLED, DEAD_LETTER
- RiskLevel: LOW, MEDIUM, HIGH, VERY_HIGH
- MarketRegime: BULL, BEAR, SIDEWAYS, HIGH_VOLATILITY, LOW_VOLATILITY, CRASH, RECOVERY
- NotificationFilter with min score, confidence, sector, symbol, regime, risk filters
- QuietHours with configurable quiet period
- CooldownConfig with per-event cooldowns
- RetryConfig with exponential backoff
- NotificationPreferences per-user settings
- NotificationEvent incoming event model
- NotificationRecord delivery record model
- DeliveryLog audit trail model
- SummaryData summary generation model
- NotificationConfig engine configuration
- NotificationQueue Redis-backed queue with local fallback
- Dead letter queue management
- Cooldown tracking via Redis
- Delivery logging
- ChannelManager multi-channel orchestrator
- TelegramChannel with MarkdownV2 formatting
- EmailChannel with HTML templates
- AnalysisEventConsumer for scoring/risk events
- SystemEventConsumer for system/summary events
- NotificationService central orchestrator
- Event routing through consumers
- User preference and filter checking
- Quiet hours and cooldown enforcement
- Batch processing loop
- Retry with dead letter after max attempts
- Health check endpoint
- Queue statistics
- Summary generation and delivery
- Unit tests for types, queue, channels, consumers, service
- Integration tests for end-to-end flows
- Architecture documentation
- Configuration guide
