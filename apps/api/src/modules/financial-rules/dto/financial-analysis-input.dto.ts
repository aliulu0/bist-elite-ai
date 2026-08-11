import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SectorAveragesDto {
  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceToBook?: number | null;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  enterpriseValueToEBITDA?: number | null;

  @ApiPropertyOptional({ example: 0.45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  debtRatio?: number | null;
}

export class FinancialAnalysisInputDto {
  @ApiProperty({ example: 1.2, nullable: true })
  @IsOptional()
  @IsNumber()
  priceToBook?: number | null;

  @ApiProperty({ example: 8, nullable: true })
  @IsOptional()
  @IsNumber()
  enterpriseValueToEBITDA?: number | null;

  @ApiProperty({ example: 32000000000, nullable: true })
  @IsOptional()
  @IsNumber()
  netProfit?: number | null;

  @ApiProperty({ example: 25000000000, nullable: true })
  @IsOptional()
  @IsNumber()
  netProfitPrevious?: number | null;

  @ApiProperty({ example: 180000000000, nullable: true })
  @IsOptional()
  @IsNumber()
  equity?: number | null;

  @ApiProperty({ example: 160000000000, nullable: true })
  @IsOptional()
  @IsNumber()
  equityPrevious?: number | null;

  @ApiProperty({ example: 95000000000, nullable: true })
  @IsOptional()
  @IsNumber()
  totalDebt?: number | null;

  @ApiProperty({ example: 275000000000, nullable: true })
  @IsOptional()
  @IsNumber()
  totalAssets?: number | null;

  @ApiPropertyOptional({ example: 'Ulaştırma', nullable: true })
  @IsOptional()
  @IsString()
  sector?: string | null;

  @ApiPropertyOptional({ type: SectorAveragesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SectorAveragesDto)
  sectorAverages?: SectorAveragesDto;
}
