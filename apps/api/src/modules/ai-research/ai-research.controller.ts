import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { AIResearchHubService } from './ai-research-hub.service';
import { AIConsensusDto, AIResearchProvidersDto, AIResearchRefreshDto } from './dto/ai-research.dto';

@ApiTags('AI Research Hub')
@Controller('research/hub')
export class AIResearchController {
  constructor(private readonly researchHub: AIResearchHubService) {}

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Get top AI research consensus entries' })
  async getTop(@Query('limit') limit?: string): Promise<AIConsensusDto[]> {
    const consensuses = this.researchHub.getTop(limit ? Number(limit) : 10);
    return consensuses.map(AIConsensusDto.from);
  }

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Get AI research provider statuses' })
  async getProviders(): Promise<AIResearchProvidersDto[]> {
    return this.researchHub.getProviderStatus();
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Trigger AI research consensus refresh' })
  async refresh(@Query('ticker') ticker: string): Promise<AIResearchRefreshDto> {
    const consensus = await this.researchHub.refreshConsensus(ticker);
    return { ticker: consensus.ticker, consensus: AIConsensusDto.from(consensus) };
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Get AI research consensus for a ticker' })
  async getConsensus(@Param('ticker') ticker: string): Promise<AIConsensusDto> {
    const consensus = await this.researchHub.getConsensus(ticker);
    return AIConsensusDto.from(consensus);
  }
}
