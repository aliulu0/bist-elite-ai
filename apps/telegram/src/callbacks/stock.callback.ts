import { Context } from 'grammy';
import { apiClient } from '../utils/api-client';
import { formatPrice, formatPercent, formatScore, formatConfidence, formatVolume } from '../utils/format';

export async function handleStockDetail(ctx: Context, symbol: string) {
  await ctx.answerCallbackQuery();

  try {
    const [stock, score] = await Promise.all([
      apiClient.getStockDetail(symbol),
      apiClient.getStockScore(symbol, 'D1'),
    ]);

    if (!stock) {
      await ctx.editMessageText(`Stock ${symbol} not found.`);
      return;
    }

    const lines = [
      `*${stock.symbol} - ${stock.name}*`,
      '',
      `*${formatPrice(stock.price)}* ${formatPercent(stock.change)}`,
      '',
      `Volume: ${formatVolume(stock.volume)}`,
      `Sector: ${stock.sector}`,
      '',
      `*Scores:*`,
      `Technical: ${formatScore(score?.technical || 0)}`,
      `Financial: ${formatScore(score?.financial || 0)}`,
      `Elite: ${formatScore(score?.elite || 0)}`,
      `Confidence: ${formatConfidence(score?.confidence || 0)}`,
      '',
      `*Risk:*`,
      `Stop Loss: ${score?.stopLoss ? formatPrice(score.stopLoss) : '--'}`,
      `Take Profit: ${score?.takeProfit ? formatPrice(score.takeProfit) : '--'}`,
    ];

    const keyboard = {
      inline_keyboard: [
        [
          { text: '⭐ Add to Watchlist', callback_data: `watchlist:add:${symbol}` },
        ],
        [
          { text: '🔄 Refresh', callback_data: `stock:${symbol}` },
          { text: '⬅️ Back', callback_data: 'back' },
        ],
      ],
    };

    await ctx.editMessageText(lines.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch (err) {
    await ctx.editMessageText('Error loading stock details.');
  }
}
