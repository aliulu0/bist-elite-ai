import { IsString, IsOptional } from 'class-validator';

export class PortfolioAdvisorRequestDto {
  @IsString()
  @IsOptional()
  portfolioId?: string;
}
