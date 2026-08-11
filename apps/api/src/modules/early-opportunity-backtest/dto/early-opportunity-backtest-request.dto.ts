import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, Min, IsInt, IsEnum } from 'class-validator';
import { BacktestHorizon, BACKTEST_HORIZONS } from '../early-opportunity-backtest.types';

export class EarlyOpportunityBacktestRequestDto {
  @ApiPropertyOptional({ example: ['THYAO.IS'], description: 'Sembol listesi (boş = tümü)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symbols?: string[];

  @ApiPropertyOptional({ example: ['1d'], description: 'Zaman çerçeveleri' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeframes?: string[];

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Başlangıç tarihi' })
  @IsOptional()
  @IsString()
  startDate?: string = '2024-01-01';

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Bitiş tarihi' })
  @IsOptional()
  @IsString()
  endDate?: string = '2024-12-31';

  @ApiPropertyOptional({ example: ['1M', '3M', '6M'], description: 'Değerlendirme ufukları' })
  @IsOptional()
  @IsArray()
  @IsEnum({ '1W': '1W', '1M': '1M', '3M': '3M', '5M': '5M', '6M': '6M', '1Y': '1Y' }, { each: true })
  horizons?: BacktestHorizon[];

  @ApiPropertyOptional({ example: 0, description: 'Minimum karar skoru filtresi' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minScore?: number = 0;

  @ApiPropertyOptional({ example: 0, description: 'Minimum güven filtresi' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minConfidence?: number = 0;

  @ApiPropertyOptional({ example: 'XU030.IS', description: 'Benchmark sembolü' })
  @IsOptional()
  @IsString()
  benchmark?: string;

  @ApiPropertyOptional({ example: 0, description: 'Komisyon oranı (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commission?: number = 0;

  @ApiPropertyOptional({ example: 0, description: 'Kayma oranı (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  slippage?: number = 0;

  @ApiPropertyOptional({ example: 10, description: 'Maksimum sembol sayısı' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSymbols?: number = 10;

  @ApiPropertyOptional({ example: 100, description: 'Maksimum karar sayısı' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDecisions?: number = 100;
}

export class EarlyOpportunityBacktestRunDto {
  @ApiProperty()
  runId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty({ type: () => EarlyOpportunityBacktestRequestDto })
  config!: EarlyOpportunityBacktestRequestDto;
}

export class DecisionTableRowDto {
  @ApiProperty() ticker!: string;
  @ApiProperty() decisionDate!: string;
  @ApiProperty() decision!: string;
  @ApiProperty() eliteScore!: number;
  @ApiProperty() confidence!: number;
  @ApiProperty() expectedReturn!: number;
  @ApiProperty({ nullable: true }) realizedReturn!: number | null;
  @ApiProperty({ nullable: true }) return1W!: number | null;
  @ApiProperty({ nullable: true }) return1M!: number | null;
  @ApiProperty({ nullable: true }) return3M!: number | null;
  @ApiProperty({ nullable: true }) return6M!: number | null;
  @ApiProperty({ nullable: true }) return1Y!: number | null;
  @ApiProperty({ nullable: true }) benchmarkReturn!: number | null;
  @ApiProperty({ nullable: true }) excessReturn!: number | null;
  @ApiProperty() maxDrawdown!: number;
  @ApiProperty({ nullable: true }) leadTime!: number | null;
  @ApiProperty() outcome!: string;
  @ApiProperty() dataQuality!: string;
}

export class BacktestRunSummaryDto {
  @ApiProperty() runId!: string;
  @ApiProperty() decisionsEvaluated!: number;
  @ApiProperty() winRate!: number;
  @ApiProperty() averageReturn!: number;
  @ApiProperty() medianReturn!: number;
  @ApiProperty({ nullable: true }) benchmarkExcessReturn!: number | null;
  @ApiProperty() maxDrawdown!: number;
  @ApiProperty({ nullable: true }) averageLeadTime!: number | null;
  @ApiProperty() falsePositiveCount!: number;
  @ApiProperty() missedOpportunityCount!: number;
  @ApiProperty() sampleQuality!: string;
  @ApiProperty() survivorshipWarning!: string;
  @ApiProperty() pointInTimeVerified!: boolean;
}

export class BacktestRunResponseDto {
  @ApiProperty() runId!: string;
  @ApiProperty() completedAt!: string;
  @ApiProperty() decisionsEvaluated!: number;
  @ApiProperty() outcomesEvaluated!: number;
  @ApiProperty() executionDurationMs!: number;
  @ApiProperty() providerCalls!: number;
  @ApiProperty() cacheHits!: number;
  @ApiProperty({ type: BacktestRunSummaryDto }) summary!: BacktestRunSummaryDto;
  @ApiProperty({ type: [DecisionTableRowDto] }) decisionTable!: DecisionTableRowDto[];
}