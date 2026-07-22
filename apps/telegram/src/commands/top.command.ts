import { Context } from 'grammy';
import { getLocale } from '../locales';
import { apiClient } from '../utils/api-client';
import { formatScore } from '../utils/format';

export async function topCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  await ctx.reply(t.common.loading);

  try {
    const results = await apiClient.getRankedStocks({ limit: 10 });

    if (!results || results.length === 0) {
      await ctx.editMessageText(t.top.noResults);
      return;
    }

    const lines = results.map((r: any, i: number) => {
      return `${i + 1}. *${r.symbol}* - ${formatScore(r.score)}`;
    });

    const keyboard = {
      inline_keyboard: results.slice(0, 5).map((r: any) => [
        { text: r.symbol, callback_data: `stock:${r.symbol}` },
      ]),
    };

    await ctx.editMessageText(
      `*${t.top.title}*\n\n${lines.join('\n')}`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  } catch (err) {
    await ctx.editMessageText(t.common.error);
  }
}
