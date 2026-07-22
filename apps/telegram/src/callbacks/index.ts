import { Bot } from 'grammy';
import { handleScanCallback } from '../commands/scan.command';
import { handleWatchlistView } from '../commands/watchlist.command';
import { handleStockDetail } from './stock.callback';
import { handleMenuCallback } from './menu.callback';
import { handleSettingsCallback } from './settings.callback';

export function registerCallbacks(bot: Bot) {
  bot.callbackQuery(/^scan:(.+)$/, async (ctx) => {
    const timeframe = ctx.match[1];
    await handleScanCallback(ctx, timeframe);
  });

  bot.callbackQuery(/^stock:(.+)$/, async (ctx) => {
    const symbol = ctx.match[1];
    await handleStockDetail(ctx, symbol);
  });

  bot.callbackQuery(/^menu:(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    await handleMenuCallback(ctx, action);
  });

  bot.callbackQuery(/^watchlist:(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    if (action === 'view') {
      await handleWatchlistView(ctx);
    }
  });

  bot.callbackQuery(/^settings:(.+)$/, async (ctx) => {
    const parts = ctx.match[1].split(':');
    await handleSettingsCallback(ctx, parts[0], parts[1]);
  });

  bot.callbackQuery('back', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Main menu', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Dashboard', callback_data: 'menu:dashboard' }],
          [{ text: '🔍 Scan', callback_data: 'menu:scan' }],
        ],
      },
    });
  });
}
