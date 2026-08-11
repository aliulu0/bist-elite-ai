import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type StrategyAction = 'BUY' | 'HOLD' | 'SELL' | 'WAIT';

export class StrategyRankingDto {
  @ApiProperty({ example: 'THYAO.IS' })
  symbol!: string;

  @ApiProperty({ example: 'indicator', enum: ['elite-score', 'opportunity', 'strategy', 'momentum', 'indicator', 'portfolio', 'multi-factor'] })
  backtestType!: string;

  @ApiProperty({ example: 3 })
  rank!: number;

  @ApiProperty({ example: 45.2, description: 'Toplam getiri (%)' })
  totalReturn!: number;

  @ApiProperty({ example: 0.18, description: 'Ranking skoru (0-1)' })
  score!: number;

  @ApiProperty({ example: 25.3, description: 'CAGR (%)' })
  cagr!: number;

  @ApiProperty({ example: 1.42, description: 'Sharpe oranı' })
  sharpeRatio!: number;

  @ApiProperty({ example: 8.1, description: 'Maksimum çekilme (%)' })
  maxDrawdown!: number;

  @ApiProperty({ example: 70, description: 'Kazanma oranı (%)' })
  winRate!: number;

  @ApiProperty({ example: 1.8, description: 'Profit faktörü' })
  profitFactor!: number;

  @ApiProperty({ example: 156, description: 'Toplam işlem' })
  totalTrades!: number;

  @ApiProperty({ example: 0.82, description: 'Öğrenme güveni (0-1)' })
  confidence!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  lastUpdated!: string;
}

export class PortfolioSignalDto {
  @ApiProperty({ example: 'THYAO.IS' })
  symbol!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ enum: ['BUY', 'HOLD', 'SELL', 'WAIT'], example: 'BUY' })
  action!: StrategyAction;

  @ApiProperty({ example: 0.71, description: 'Pozisyon güveni (0-1)' })
  confidence!: number;

  @ApiProperty({ example: 60, description: 'Pozisyon büyüklüğü (% portföy)' })
  sizePercent!: number;

  @ApiProperty({ description: 'Dayanma nedeni', type: [String] })
  rationale!: string[];

  @ApiProperty({ description: 'Dayanak gösteren backtest metrikleri', type: Object })
  basedOn!: {
    totalReturn: number;
    sharpeRatio: number;
    winRate: number;
    maxDrawdown: number;
  };
}

export class TomorrowFeedbackResultDto {
  @ApiProperty({ example: 'THYAO.IS' })
  symbol!: string;

  @ApiProperty({ example: 68 })
  predicted!: number;

  @ApiProperty({ example: 75.3, description: 'Gerçekleşen getiri ya da skor' })
  actual!: number;

  @ApiProperty({ example: 7.3, description: 'Delta (actual - predicted)' })
  delta!: number;

  @ApiProperty({ enum: ['UPGRADE', 'DOWNGRADE', 'KEEP'], example: 'UPGRADE' })
  direction!: 'UPGRADE' | 'DOWNGRADE' | 'KEEP';

  @ApiProperty({ example: 0.82, description: 'Güncellenmiş güven (0-1)' })
  confidence!: number;

  @ApiProperty({ example: 'Backtest getirisi tahmine göre üstünde' })
  reason!: string;
}

export class EliteScoreWeightDeltaDto {
  @ApiProperty({ example: 'THYAO.IS' })
  symbol!: string;

  @ApiProperty({ description: 'Skor boyutlarına göre güncellenmiş ağırlık çeyrekleri', type: Object })
  weightDelta!: Record<string, number>;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class BacktestReportDto {
  @ApiProperty({ example: 'THYAO.IS:1d:indicator' })
  id!: string;

  @ApiProperty({ example: 'THYAO.IS' })
  symbol!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: 'indicator' })
  backtestType!: string;

  @ApiProperty({ description: 'Tam backtest sonucu', type: Object })
  result!: Record<string, unknown>;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;
}
