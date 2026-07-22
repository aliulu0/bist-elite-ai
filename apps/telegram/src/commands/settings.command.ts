import { Context } from 'grammy';
import { getLocale } from '../locales';

export async function settingsCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🇬🇧 English', callback_data: 'settings:lang:en' },
        { text: '🇹🇷 Türkçe', callback_data: 'settings:lang:tr' },
      ],
      [
        { text: '🔔 Notifications ON', callback_data: 'settings:notif:on' },
        { text: '🔕 Notifications OFF', callback_data: 'settings:notif:off' },
      ],
      [
        { text: '📊 Timeframe: D1', callback_data: 'settings:tf:D1' },
        { text: '📊 Timeframe: W1', callback_data: 'settings:tf:W1' },
      ],
    ],
  };

  await ctx.reply(`*${t.settings.title}*`, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}
