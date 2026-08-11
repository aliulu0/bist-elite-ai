import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddPositionDto {
  @IsString()
  ticker!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  averageCost!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  manualTarget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  manualStop?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  portfolioWeight?: number;
}

export class UpdatePositionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averageCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  manualTarget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  manualStop?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  portfolioWeight?: number;
}
