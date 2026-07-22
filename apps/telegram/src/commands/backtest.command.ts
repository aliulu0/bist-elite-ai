import { Context } from 'grammy';
import { getLocale } from '../locales';
import { apiClient } from '../utils/api-client';
import { formatPercent, formatScore } from '../utils/format';

export async function backtestCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  await ctx.reply(t.common.loading);

  try {
    const results = await apiClient.getBacktestResults({ limit: 5 });

    if (!results || results.length === 0) {
      await ctx.editMessageText(t.backtest.noResults);
      return;
    }

    const lines = [`*${t.backtest.title}*`, ''];
    results.forEach((r: any) => {
      lines.push(`*${r.strategyName}* (${r.timeframe})`);
      lines.push(`  Return: ${formatPercent(r.totalReturn)}`);
      lines.push(`  Sharpe: ${formatScore(r.sharpeRatio)}`);
      lines.push(`  Win Rate: ${r.winRate?.toFixed(1) || 0}%`);
      lines.push('');
    });

    await ctx.editMessageText(lines.join('\n'), { parse_mode: 'Markdown' });
  } catch (err) {
    await ctx.editMessageText(t.common.error);
  }
}
