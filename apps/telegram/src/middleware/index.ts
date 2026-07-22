import { Context, NextFunction } from 'grammy';
import { logger } from '../utils/logger';

const rateLimitMap = new Map<number, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;

export function rateLimitMiddleware() {
  return async (ctx: Context, next: NextFunction) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const now = Date.now();
    const timestamps = rateLimitMap.get(userId) || [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

    if (recent.length >= RATE_LIMIT_MAX) {
      logger.warn(`Rate limit exceeded for user ${userId}`);
      return ctx.reply('Rate limit exceeded. Please wait a moment.');
    }

    recent.push(now);
    rateLimitMap.set(userId, recent);

    return next();
  };
}

export function loggingMiddleware() {
  return async (ctx: Context, next: NextFunction) => {
    const start = Date.now();
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    const command = ctx.message?.text || ctx.callbackQuery?.data;

    logger.info(`[${chatId}] User ${userId}: ${command}`);

    await next();

    const duration = Date.now() - start;
    logger.debug(`[${chatId}] Response time: ${duration}ms`);
  };
}

export function errorMiddleware() {
  return async (ctx: Context, next: NextFunction) => {
    try {
      await next();
    } catch (err) {
      logger.error('Bot error:', err);

      const message = ctx.from?.language_code === 'tr'
        ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
        : 'An error occurred. Please try again.';

      try {
        await ctx.reply(message);
      } catch {
        logger.error('Failed to send error message');
      }
    }
  };
}

export function languageMiddleware() {
  return async (ctx: Context, next: NextFunction) => {
    const lang = ctx.from?.language_code?.startsWith('tr') ? 'tr' : 'en';
    (ctx as any).language = lang;
    return next();
  };
}
