import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { registerCommands } from './commands';
import { registerCallbacks } from './callbacks';
import {
  rateLimitMiddleware,
  loggingMiddleware,
  errorMiddleware,
  languageMiddleware,
} from './middleware';
import { logger } from './utils/logger';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const bot = new Bot(token);

bot.use(errorMiddleware());
bot.use(loggingMiddleware());
bot.use(rateLimitMiddleware());
bot.use(languageMiddleware());

registerCommands(bot);
registerCallbacks(bot);

bot.catch((err) => {
  logger.error('Bot error:', err);
});

const startBot = async () => {
  if (process.env.BOT_MODE === 'webhook') {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('WEBHOOK_URL is required for webhook mode');
    }
    await bot.api.setWebhook(webhookUrl);
    logger.info(`Webhook set to ${webhookUrl}`);
  } else {
    logger.info('Starting bot in long-polling mode...');
    await bot.start({
      onStart: () => logger.info('Bot started successfully'),
    });
  }
};

startBot().catch((err) => {
  logger.error('Failed to start bot:', err);
  process.exit(1);
});

export default bot;
