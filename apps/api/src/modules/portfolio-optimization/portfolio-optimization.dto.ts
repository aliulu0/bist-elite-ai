import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PortfolioOptimizationResult } from './portfolio-optimization.types';

export class PortfolioOptimizationTickerDto {
  @ApiProperty({ description: 'Kod (Ticker)', example: 'THYAO' })
  ticker!: string;

  @ApiPropertyOptional({ description: 'Şirket adı', nullable: true })
  @IsOptional()
  company?: string | null;
}

export class PortfolioOptimizationResultDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;

  @ApiPropertyOptional({ description: 'Şirket', nullable: true })
  company!: string | null;

  @ApiProperty({ description: 'Portföy Skoru' })
  portfolioScore!: number;

  @ApiProperty({ description: 'Risk Skoru' })
  riskScore!: number;

  @ApiProperty({ description: 'Diversifikasyon Skoru' })
  diversificationScore!: number;

  @ApiProperty({ type: () => [Object], description: 'Sektör Dağılımı' })
  sectorDistribution!: { sector: string; weight: number }[];

  @ApiProperty({ description: 'Beklenen Getiri' })
  expectedReturn!: number;

  @ApiProperty({ description: 'Beklenen Risk' })
  expectedRisk!: number;

  @ApiProperty({ description: 'Volatilite' })
  volatility!: number;

  @ApiProperty({ description: 'Maksimum Drawdown Tahmini' })
  maxDrawdownEstimate!: number;

  @ApiProperty({ description: 'Sharpe Oranı Tahmini' })
  sharpeEstimate!: number;

  @ApiProperty({ description: 'Beta Tahmini' })
  betaEstimate!: number;

  @ApiProperty({ type: () => Object, description: 'Korelasyon Matrisi' })
  correlationMatrix!: Record<string, number>;

  @ApiProperty({ type: () => [Object], description: 'Pozisyon Ağırlıkları' })
  positionWeights!: { symbol: string; weight: number; minWeight: number; maxWeight: number; reason: string }[];

  @ApiProperty({ type: () => Object, description: 'Önerilen Tahsis' })
  suggestedAllocation!: Record<string, number>;

  @ApiProperty({ description: 'Nakit Oranı' })
  cashRatio!: number;

  @ApiProperty({ type: () => Object, description: 'Sektör Limitleri' })
  sectorLimits!: Record<string, number>;

  @ApiProperty({ description: 'AI Portföy Yorumu' })
  aiComment!: string;

  @ApiProperty({ type: () => [String], description: 'Uyarılar' })
  warnings!: string[];

  @ApiProperty({ type: () => [String], description: 'Güçlü Yönler' })
  strengths!: string[];

  @ApiProperty({ type: () => [String], description: 'Zayıf Yönler' })
  weaknesses!: string[];

  @ApiProperty({ type: () => [String], description: 'Önerilen Aksiyonlar' })
  recommendedActions!: string[];

  @ApiProperty({ description: 'Değerlendirme Zamanı' })
  evaluatedAt!: string;
}

export class PortfolioOptimizationResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;

  @ApiProperty({ description: 'Sonuç' })
  sonuc!: PortfolioOptimizationResultDto;

  @ApiProperty({ description: 'Tahmin Zamanı' })
  tahminZamani!: string;
}