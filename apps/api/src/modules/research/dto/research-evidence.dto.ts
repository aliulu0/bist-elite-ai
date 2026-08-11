import { IsOptional, IsString, IsArray, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SourceClassification, SourceCategory, PDFType } from '../interfaces/agent-reach.types';

export class DiscoveredPDFDto {
  @IsString()
  id!: string;

  @IsString()
  url!: string;

  @IsString()
  fileName!: string;

  @IsString()
  date!: string;

  @IsString()
  type!: PDFType;

  @IsString()
  company!: string;

  @IsString()
  discoveredAt!: string;

  @IsString()
  source!: string;

  @IsString()
  classification!: SourceClassification;
}

export class DiscoveredRSSDto {
  @IsString()
  id!: string;

  @IsString()
  url!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsString()
  discoveredAt!: string;

  @IsString()
  source!: string;

  @IsString()
  classification!: SourceClassification;

  @IsBoolean()
  isOfficial!: boolean;
}

export class AgentReachSourceDto {
  @IsString()
  id!: string;

  @IsString()
  url!: string;

  @IsString()
  title!: string;

  @IsString()
  classification!: SourceClassification;

  @IsString()
  category!: SourceCategory;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsString()
  discoveredAt!: string;

  @IsOptional()
  @IsString()
  lastVerifiedAt?: string;

  @IsBoolean()
  isOfficial!: boolean;

  @IsBoolean()
  isActive!: boolean;

  @IsNumber()
  reliabilityScore!: number;
}

export class ResearchEvidenceDto {
  @IsString()
  ticker!: string;

  @IsString()
  companyName!: string;

  @IsString()
  sector!: string;

  @IsOptional()
  @IsString()
  officialWebsite?: string;

  @IsOptional()
  @IsString()
  investorRelationsUrl?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredPDFDto)
  annualReports?: DiscoveredPDFDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredPDFDto)
  quarterlyReports?: DiscoveredPDFDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredPDFDto)
  investorPresentations?: DiscoveredPDFDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredPDFDto)
  sustainabilityReports?: DiscoveredPDFDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredPDFDto)
  governanceDocuments?: DiscoveredPDFDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredPDFDto)
  esgReports?: DiscoveredPDFDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AgentReachSourceDto)
  pressReleases?: AgentReachSourceDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AgentReachSourceDto)
  newsUrls?: AgentReachSourceDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscoveredRSSDto)
  rssUrls?: DiscoveredRSSDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AgentReachSourceDto)
  sources?: AgentReachSourceDto[];

  @IsNumber()
  evidenceCount!: number;

  @IsNumber()
  officialCount!: number;

  @IsString()
  discoveredAt!: string;

  @IsString()
  expiresAt!: string;
}

export class AgentReachSearchResultDto {
  @IsString()
  query!: string;

  @IsString()
  engine!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AgentReachSourceDto)
  results?: AgentReachSourceDto[];

  @IsNumber()
  totalResults!: number;

  @IsNumber()
  searchTime!: number;

  @IsString()
  discoveredAt!: string;
}

export class AgentReachSectorResultDto {
  @IsString()
  sector!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  companies?: Array<{
    ticker: string;
    companyName: string;
    website: string | null;
    irUrl: string | null;
    rssCount: number;
    sourceCount: number;
    evidenceCount: number;
  }>;

  @IsString()
  discoveredAt!: string;

  @IsString()
  expiresAt!: string;
}

export class ResearchEvidenceResponseDto {
  success!: boolean;
  data?: {
    company?: ResearchEvidenceDto;
    search?: AgentReachSearchResultDto;
    sector?: AgentReachSectorResultDto;
  };
  error?: string;
  timestamp!: string;
}