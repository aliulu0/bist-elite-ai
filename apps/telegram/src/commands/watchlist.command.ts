import { Context } from 'grammy';
import { getLocale } from '../locales';
import { apiClient } from '../utils/api-client';

export async function watchlistCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  const keyboard = {
    inline_keyboard: [
      [
        { text: '➕ Add Stock', callback_data: 'watchlist:add' },
        { text: '➖ Remove Stock', callback_data: 'watchlist:remove' },
      ],
      [
        { text: '📋 View Watchlist', callback_data: 'watchlist:view' },
      ],
    ],
  };

  await ctx.reply(`*${t.watchlist.title}*`, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

export async function handleWatchlistView(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  await ctx.answerCallbackQuery();

  try {
    const watchlists = await apiClient.getWatchlists();

    if (!watchlists || watchlists.length === 0) {
      await ctx.editMessageText(t.watchlist.empty);
      return;
    }

    const lines = watchlists.map((w: any) => {
      return `*${w.name}*\n${w.symbols?.length || 0} stocks`;
    });

    await ctx.editMessageText(
      `*${t.watchlist.title}*\n\n${lines.join('\n\n')}`,
      { parse_mode: 'Markdown' },
    );
  } catch (err) {
    await ctx.editMessageText(t.common.error);
  }
}
