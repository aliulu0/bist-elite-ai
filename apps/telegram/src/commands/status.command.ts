import { Context } from 'grammy';
import { getLocale } from '../locales';
import { apiClient } from '../utils/api-client';

export async function statusCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  await ctx.reply(t.common.loading);

  try {
    const status = await apiClient.getSystemStatus();

    const lines = [
      `*${t.status.title}*`,
      '',
      `${t.status.api}: ${status.api === 'healthy' ? '✅' : '❌'} ${status.api}`,
      `${t.status.database}: ${status.database === 'healthy' ? '✅' : '❌'} ${status.database}`,
      `${t.status.redis}: ${status.redis === 'healthy' ? '✅' : '❌'} ${status.redis}`,
    ];

    await ctx.editMessageText(lines.join('\n'), { parse_mode: 'Markdown' });
  } catch (err) {
    await ctx.editMessageText(t.common.error);
  }
}
