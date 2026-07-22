import { Context } from 'grammy';
import { getLocale } from '../locales';

export async function handleSettingsCallback(ctx: Context, action: string, value: string) {
  await ctx.answerCallbackQuery();

  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  if (action === 'lang') {
    const newLang = value as 'en' | 'tr';
    (ctx as any).language = newLang;
    const newT = getLocale(newLang);
    await ctx.editMessageText(
      `*${newT.settings.title}*\n\nLanguage changed to ${newLang === 'en' ? 'English' : 'Türkçe'}`,
      { parse_mode: 'Markdown' },
    );
  } else if (action === 'notif') {
    const status = value === 'on' ? 'enabled' : 'disabled';
    await ctx.editMessageText(
      `*${t.settings.title}*\n\nNotifications ${status}`,
      { parse_mode: 'Markdown' },
    );
  } else if (action === 'tf') {
    await ctx.editMessageText(
      `*${t.settings.title}*\n\nDefault timeframe set to ${value}`,
      { parse_mode: 'Markdown' },
    );
  }
}
