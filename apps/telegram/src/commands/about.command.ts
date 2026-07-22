import { Context } from 'grammy';
import { getLocale } from '../locales';

export async function aboutCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  const lines = [
    `*${t.about.title}*`,
    '',
    `${t.about.version}: 1.0.0`,
    '',
    t.about.description,
  ];

  await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
}
