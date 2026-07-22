import { Context } from 'grammy';
import { getLocale } from '../locales';
import { apiClient } from '../utils/api-client';
import { formatScore, formatConfidence } from '../utils/format';

export async function signalCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  await ctx.reply(t.common.loading);

  try {
    const signals = await apiClient.getSignals('D1');

    if (!signals || signals.length === 0) {
      await ctx.editMessageText(t.signal.noSignals);
      return;
    }

    const buySignals = signals.filter((s: any) => s.action === 'BUY');
    const sellSignals = signals.filter((s: any) => s.action === 'SELL');

    const lines = [`*${t.signal.title}*`, ''];

    if (buySignals.length > 0) {
      lines.push('*BUY Signals:*');
      buySignals.slice(0, 5).forEach((s: any) => {
        lines.push(`🟢 ${s.symbol} | ${s.strength} | ${formatScore(s.score || 0)}`);
      });
    }

    if (sellSignals.length > 0) {
      lines.push('', '*SELL Signals:*');
      sellSignals.slice(0, 5).forEach((s: any) => {
        lines.push(`🔴 ${s.symbol} | ${s.strength} | ${formatScore(s.score || 0)}`);
      });
    }

    await ctx.editMessageText(lines.join('\n'), { parse_mode: 'Markdown' });
  } catch (err) {
    await ctx.editMessageText(t.common.error);
  }
}
