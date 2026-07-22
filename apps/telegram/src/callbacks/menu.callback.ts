import { Context } from 'grammy';
import { getLocale } from '../locales';
import { scanCommand } from '../commands/scan.command';
import { topCommand } from '../commands/top.command';
import { eliteCommand } from '../commands/elite.command';
import { portfolioCommand } from '../commands/portfolio.command';
import { watchlistCommand } from '../commands/watchlist.command';
import { signalCommand } from '../commands/signal.command';
import { backtestCommand } from '../commands/backtest.command';
import { settingsCommand } from '../commands/settings.command';
import { aboutCommand } from '../commands/about.command';

export async function handleMenuCallback(ctx: Context, action: string) {
  await ctx.answerCallbackQuery();

  const commandMap: Record<string, (ctx: Context) => Promise<void>> = {
    dashboard: async (ctx) => {
      const lang = (ctx as any).language || 'en';
      const t = getLocale(lang);
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔍 Scan', callback_data: 'menu:scan' },
            { text: '⭐ Watchlist', callback_data: 'menu:watchlist' },
          ],
          [
            { text: '💼 Portfolio', callback_data: 'menu:portfolio' },
            { text: '📡 Signals', callback_data: 'menu:signals' },
          ],
        ],
      };
      await ctx.editMessageText(`*${t.welcome.title}*\n\nSelect an option:`, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    },
    scan: scanCommand,
    top: topCommand,
    elite: eliteCommand,
    portfolio: portfolioCommand,
    watchlist: watchlistCommand,
    signals: signalCommand,
    backtest: backtestCommand,
    settings: settingsCommand,
    about: aboutCommand,
  };

  const handler = commandMap[action];
  if (handler) {
    await handler(ctx);
  }
}
