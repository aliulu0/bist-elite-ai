import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { ResearchIntelligenceService } from './research-intelligence.service';
import {
  ResearchIntelligenceQueryDto,
  ResearchIntelligenceDashboardDto,
  CompanyResearchDto,
  ResearchProviderStatusEntryDto,
} from './dto/research-intelligence.dto';

@ApiTags('Research Intelligence')
@Controller('research/intelligence')
export class ResearchIntelligenceController {
  constructor(private readonly researchIntelligence: ResearchIntelligenceService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get research intelligence dashboard' })
  async getDashboard(@Query() query: ResearchIntelligenceQueryDto): Promise<ResearchIntelligenceDashboardDto> {
    const dashboard = await this.researchIntelligence.getDashboard(query.ticker);
    return { ...dashboard, timestamp: new Date().toISOString() };
  }

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Get research provider status entries' })
  async getProviders(): Promise<ResearchProviderStatusEntryDto[]> {
    const entries = await this.researchIntelligence.getProviderStatus();
    return entries.map((entry) => ({ ...entry, timestamp: new Date().toISOString() }));
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Get research intelligence for a specific company' })
  async getCompany(@Param('ticker') ticker: string): Promise<CompanyResearchDto> {
    const bundle = await this.researchIntelligence.getCompanyResearch(ticker);
    return { ...bundle, timestamp: new Date().toISOString() };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Trigger a research intelligence refresh' })
  async refresh(): Promise<ResearchIntelligenceDashboardDto> {
    const dashboard = await this.researchIntelligence.refreshResearch();
    return { ...dashboard, timestamp: new Date().toISOString() };
  }
}