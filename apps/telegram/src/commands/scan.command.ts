import { Context } from 'grammy';
import { getLocale } from '../locales';
import { apiClient } from '../utils/api-client';
import { formatPrice, formatPercent, formatScore } from '../utils/format';

const timeframes = ['M4', 'D1', 'W1', 'M1'];

export async function scanCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  const keyboard = {
    inline_keyboard: timeframes.map((tf) => [
      { text: tf, callback_data: `scan:${tf}` },
    ]),
  };

  await ctx.reply(`*${t.scan.title}*\n\n${t.scan.selectTimeframe}`, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

export async function handleScanCallback(ctx: Context, timeframe: string) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  await ctx.answerCallbackQuery();

  try {
    const results = await apiClient.getOpportunities({ timeframe, limit: 10 });

    if (!results || results.length === 0) {
      await ctx.editMessageText(t.scan.noResults);
      return;
    }

    const lines = results.map((r: any, i: number) => {
      const change = r.change >= 0 ? `+${r.change?.toFixed(2) || 0}%` : `${r.change?.toFixed(2) || 0}%`;
      return `${i + 1}. *${r.symbol}* - ${formatScore(r.eliteScore)} | ${change}`;
    });

    const keyboard = {
      inline_keyboard: results.slice(0, 5).map((r: any) => [
        { text: r.symbol, callback_data: `stock:${r.symbol}` },
      ]),
    };

    await ctx.editMessageText(
      `*${t.scan.title}* (${timeframe})\n\n${lines.join('\n')}`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  } catch (err) {
    await ctx.editMessageText(t.common.error);
  }
}
