import { IsString, IsOptional, IsIn } from 'class-validator';

export class InvestmentReportRequestDto {
  @IsString()
  symbol!: string;

  @IsString()
  @IsOptional()
  @IsIn(['1d', '1w', '1m', '3m', '6m'])
  timeframe?: string;

  @IsString()
  @IsOptional()
  @IsIn(['pdf', 'markdown'])
  format?: string;
}
