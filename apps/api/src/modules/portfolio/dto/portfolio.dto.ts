import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { PortfolioType, TransactionType, PerformancePeriod } from '../types/portfolio.types';

export class CreatePortfolioDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(['MAIN', 'GROWTH', 'DIVIDEND', 'LONG_TERM', 'TRADING', 'PAPER', 'CUSTOM'])
  type?: PortfolioType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialCash?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  benchmark?: string;
}

export class UpdatePortfolioDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['MAIN', 'GROWTH', 'DIVIDEND', 'LONG_TERM', 'TRADING', 'PAPER', 'CUSTOM'])
  type?: PortfolioType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cash?: number;

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export class ExecuteTransactionDto {
  @IsString()
  symbol!: string;

  @IsEnum(['BUY', 'SELL'])
  type!: TransactionType;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commission?: number;

  @IsOptional()
  @IsString()
  executedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PerformanceQueryDto {
  @IsOptional()
  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'SINCE_INCEPTION'])
  period?: PerformancePeriod;
}

export class ExportQueryDto {
  @IsEnum(['csv', 'json', 'excel'])
  format!: 'csv' | 'json' | 'excel';
}
