import { Context } from 'grammy';
import { getLocale } from '../locales';
import { apiClient } from '../utils/api-client';
import { formatPrice, formatPercent } from '../utils/format';

export async function portfolioCommand(ctx: Context) {
  const lang = (ctx as any).language || 'en';
  const t = getLocale(lang);

  await ctx.reply(t.common.loading);

  try {
    const portfolio = await apiClient.getPortfolioSummary();

    if (!portfolio) {
      await ctx.editMessageText(t.portfolio.noPositions);
      return;
    }

    const lines = [
      `*${t.portfolio.title}*`,
      '',
      `${t.portfolio.totalValue}: ${formatPrice(portfolio.totalValue)}`,
      `${t.portfolio.dailyReturn}: ${formatPercent(portfolio.dailyReturn)}`,
      `${t.portfolio.totalReturn}: ${formatPercent(portfolio.totalReturn)}`,
    ];

    if (portfolio.positions && portfolio.positions.length > 0) {
      lines.push('', `*${t.portfolio.positions}:*`);
      portfolio.positions.forEach((p: any, i: number) => {
        lines.push(`${i + 1}. ${p.symbol} - ${p.weight.toFixed(1)}%`);
      });
    }

    await ctx.editMessageText(lines.join('\n'), { parse_mode: 'Markdown' });
  } catch (err) {
    await ctx.editMessageText(t.common.error);
  }
}
