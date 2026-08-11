import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RuleStat } from '../../rule-analytics/rule-analytics.types';
import { BacktestStrategy } from '../backtest.types';

export class PerformanceSummaryDto {
  @ApiProperty({ example: 12.5 })
  totalReturn!: number;

  @ApiProperty({ example: 25.3 })
  cagr!: number;

  @ApiProperty({ example: 1.42 })
  sharpeRatio!: number;

  @ApiProperty({ example: 8.1 })
  maxDrawdown!: number;

  @ApiProperty({ example: 70 })
  winRate!: number;

  @ApiProperty({ example: 1.8 })
  profitFactor!: number;

  @ApiProperty({ example: 156 })
  totalTrades!: number;
}

export class RuleStatDto {
  @ApiProperty({ example: 'ALWAYS' })
  rule!: string;

  @ApiProperty({ example: 156 })
  totalTrades!: number;

  @ApiProperty({ example: 94 })
  winningTrades!: number;

  @ApiProperty({ example: 62 })
  losingTrades!: number;

  @ApiProperty({ example: 60.3 })
  winRate!: number;

  @ApiProperty({ example: 2.1 })
  avgReturn!: number;

  @ApiProperty({ example: 1.9 })
  medianReturn!: number;

  @ApiProperty({ example: 12.5 })
  totalReturn!: number;

  @ApiProperty({ example: 8.2 })
  bestTrade!: number;

  @ApiProperty({ example: -4.5 })
  worstTrade!: number;

  @ApiProperty({ example: 1.2 })
  sharpe!: number;
}

export class LearningSummaryDto {
  @ApiProperty({ example: 0.82, description: 'Öğrenme güven skoru (0-1)' })
  confidence!: number;

  @ApiProperty({ example: 3.4, description: 'Beklenen iyileşme (% puan)' })
  expectedImprovement!: number;

  @ApiProperty({ example: 70, description: 'Kazanma oranı (%)' })
  winRate!: number;

  @ApiProperty({ example: 12.5, description: 'Toplam getiri (%)' })
  totalReturn!: number;
}

export class LearningReportDto {
  @ApiProperty({ example: 'THYAO.IS' })
  symbol!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ enum: ['elite-score', 'opportunity', 'strategy', 'momentum', 'indicator', 'portfolio', 'multi-factor'], example: 'indicator' })
  backtestType!: string;

  @ApiProperty({ description: 'Strateji sinyalleri', type: Object })
  strategy!: BacktestStrategy;

  @ApiProperty({ description: 'Performans özetinin', type: PerformanceSummaryDto })
  performance!: PerformanceSummaryDto;

  @ApiProperty({ description: 'Kural istatistikleri', type: [RuleStatDto] })
  ruleStats!: RuleStat[];

  @ApiProperty({ description: 'Türlere göre önerilen ağırlıklar', type: Object })
  weightRecommendations!: Record<string, number>;

  @ApiProperty({ example: 0.82, description: 'Güven skoru (0-1)' })
  confidence!: number;

  @ApiProperty({ example: 3.4, description: 'Beklenen iyileşme' })
  expectedImprovement!: number;

  @ApiProperty({ description: 'Öneriler', type: [String] })
  recommendations!: string[];

  @ApiProperty({ description: 'Öğrenme akışı adımları', type: [String] })
  learningFlowSteps!: string[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}
