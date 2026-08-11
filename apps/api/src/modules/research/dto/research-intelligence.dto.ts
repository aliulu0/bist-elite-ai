import { IsOptional, IsString, Matches } from 'class-validator';
import {
  CompanyResearchBundle,
  ResearchIntelligenceDashboard,
  ResearchProviderStatusEntry,
} from '../interfaces/research-intelligence.types';

export class ResearchIntelligenceQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9.]+$/, { message: 'Ticker must be alphanumeric (letters, digits, dots)' })
  ticker?: string;
}

export type ResearchIntelligenceDashboardDto = ResearchIntelligenceDashboard & { timestamp: string };

export type CompanyResearchDto = CompanyResearchBundle & { timestamp: string };

export type ResearchProviderStatusEntryDto = ResearchProviderStatusEntry & { timestamp: string };
