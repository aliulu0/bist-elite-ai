import { PrismaClient, Prisma } from '@prisma/client';

const settings: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'timeframes.supported',
    value: ['M4', 'D1', 'W1', 'M1'],
    category: 'analysis',
    description: 'Supported analysis timeframes',
  },
  {
    key: 'timeframes.default',
    value: 'D1',
    category: 'analysis',
    description: 'Default analysis timeframe',
  },
  {
    key: 'scoring.technical.weight',
    value: 0.6,
    category: 'scoring',
    description: 'Weight for technical score in elite score',
  },
  {
    key: 'scoring.financial.weight',
    value: 0.4,
    category: 'scoring',
    description: 'Weight for financial score in elite score',
  },
  {
    key: 'scoring.confidence.threshold',
    value: 0.7,
    category: 'scoring',
    description: 'Minimum confidence threshold for signals',
  },
  {
    key: 'risk.maxPositionSize',
    value: 0.1,
    category: 'risk',
    description: 'Maximum position size as fraction of portfolio',
  },
  {
    key: 'risk.maxSectorExposure',
    value: 0.3,
    category: 'risk',
    description: 'Maximum sector exposure as fraction of portfolio',
  },
  {
    key: 'risk.maxCorrelation',
    value: 0.7,
    category: 'risk',
    description: 'Maximum correlation between positions',
  },
  {
    key: 'risk.stopLossPercent',
    value: 0.08,
    category: 'risk',
    description: 'Default stop loss percentage',
  },
  {
    key: 'risk.takeProfitRatio',
    value: 2.0,
    category: 'risk',
    description: 'Default take profit to stop loss ratio',
  },
  {
    key: 'backtest.initialCapital',
    value: 100000,
    category: 'backtest',
    description: 'Initial capital for backtesting',
  },
  {
    key: 'backtest.commission',
    value: 0.001,
    category: 'backtest',
    description: 'Commission rate for backtesting',
  },
  {
    key: 'backtest.slippage',
    value: 0.001,
    category: 'backtest',
    description: 'Slippage for backtesting',
  },
  {
    key: 'detection.minScore',
    value: 70,
    category: 'detection',
    description: 'Minimum elite score for opportunity detection',
  },
  {
    key: 'detection.minConfidence',
    value: 0.6,
    category: 'detection',
    description: 'Minimum confidence for opportunity detection',
  },
  {
    key: 'market.bist.exchange',
    value: 'BIST',
    category: 'market',
    description: 'Primary exchange identifier',
  },
  {
    key: 'market.bist.currency',
    value: 'TRY',
    category: 'market',
    description: 'Primary currency',
  },
  {
    key: 'market.bist.timezone',
    value: 'Europe/Istanbul',
    category: 'market',
    description: 'Market timezone',
  },
  {
    key: 'market.bist.openHour',
    value: '10:00',
    category: 'market',
    description: 'Market open hour',
  },
  {
    key: 'market.bist.closeHour',
    value: '18:00',
    category: 'market',
    description: 'Market close hour',
  },
  {
    key: 'notifications.enabled',
    value: true,
    category: 'notifications',
    description: 'Enable notifications',
  },
  {
    key: 'notifications.minScore',
    value: 80,
    category: 'notifications',
    description: 'Minimum score for notifications',
  },
  {
    key: 'telegram.enabled',
    value: false,
    category: 'telegram',
    description: 'Enable Telegram bot',
  },
  {
    key: 'logging.level',
    value: 'info',
    category: 'logging',
    description: 'Application log level',
  },
  {
    key: 'logging.retentionDays',
    value: 90,
    category: 'logging',
    description: 'Log retention in days',
  },
];

export async function seedSystemSettings(prisma: PrismaClient) {
  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
}
