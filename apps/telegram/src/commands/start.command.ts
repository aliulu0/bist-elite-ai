import { Context } from 'grammy';
import { getLocale } from '../locales';

export async function startCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📊 Dashboard', callback_data: 'menu:dashboard' },
        { text: '🔍 Scan', callback_data: 'menu:scan' },
      ],
      [
        { text: '⭐ Watchlist', callback_data: 'menu:watchlist' },
        { text: '💼 Portfolio', callback_data: 'menu:portfolio' },
      ],
      [
        { text: '📡 Signals', callback_data: 'menu:signals' },
        { text: '📈 Backtest', callback_data: 'menu:backtest' },
      ],
      [
        { text: '⚙️ Settings', callback_data: 'menu:settings' },
        { text: 'ℹ️ About', callback_data: 'menu:about' },
      ],
    ],
  };

  await ctx.reply(
    `*${t.welcome.title}*\n\n${t.welcome.description}\n\n${t.welcome.startHint}`,
    { parse_mode: 'Markdown', reply_markup: keyboard },
  );
}
