import { Context } from 'grammy';
import { getLocale } from '../locales';

export async function helpCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  const commands = t.help.commands
    .map((c) => `\`${c.cmd}\` - ${c.desc}`)
    .join('\n');

  await ctx.reply(
    `*${t.help.title}*\n\n${commands}`,
    { parse_mode: 'Markdown' },
  );
}
