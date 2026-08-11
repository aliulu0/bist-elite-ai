import { IsString, IsOptional, IsArray } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  message!: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsString()
  @IsOptional()
  portfolioId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  context?: string[];
}
