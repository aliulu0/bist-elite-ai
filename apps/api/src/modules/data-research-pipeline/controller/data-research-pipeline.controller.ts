import { Controller, Get, Query, Param, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Public } from '../../../common/auth/decorators';
import { DataResearchPipelineService } from '../services/data-research-pipeline.service';
import { AgentReachAdapter } from '../providers/agent-reach.adapter';

@ApiTags('Data Research Pipeline')
@Controller('data-research')
export class DataResearchPipelineController {
  constructor(
    private readonly pipeline: DataResearchPipelineService,
    private readonly agentReach: AgentReachAdapter,
  ) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Get overall data health report' })
  async getDataHealth() {
    return this.pipeline.getDataHealth();
  }

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Get provider health status' })
  async getProviderHealth() {
    return this.pipeline.getProviderHealth();
  }

  @Get('freshness')
  @Public()
  @ApiOperation({ summary: 'Get data freshness report' })
  async getDataFreshness() {
    return this.pipeline.getDataFreshness();
  }

  @Get('freshness/:provider')
  @Public()
  @ApiOperation({ summary: 'Get freshness for specific provider' })
  @ApiParam({ name: 'provider', description: 'Provider name (e.g., fintables, yahoo, kap)' })
  async getFreshnessForProvider(@Param('provider') provider: string) {
    return this.pipeline.getFreshnessForProvider(provider);
  }

  @Get('source-quality')
  @Public()
  @ApiOperation({ summary: 'Get source quality report' })
  async getSourceQuality() {
    return this.pipeline.getSourceQuality();
  }

  @Get('source-quality/:provider')
  @Public()
  @ApiOperation({ summary: 'Get source quality for specific provider' })
  @ApiParam({ name: 'provider', description: 'Provider name' })
  async getSourceQualityForProvider(@Param('provider') provider: string) {
    return this.pipeline.getSourceQualityForProvider(provider);
  }

  @Get('evidence/:ticker')
  @Public()
  @ApiOperation({ summary: 'Get research evidence for ticker' })
  @ApiParam({ name: 'ticker', description: 'BIST ticker symbol (e.g., THYAO)' })
  async getResearchEvidence(@Param('ticker') ticker: string) {
    return this.pipeline.getResearchEvidence(ticker);
  }

  @Get('quality/:ticker')
  @Public()
  @ApiOperation({ summary: 'Get data quality report for ticker' })
  @ApiParam({ name: 'ticker', description: 'BIST ticker symbol' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Timeframe (default: 1d)' })
  async getDataQuality(@Param('ticker') ticker: string, @Query('timeframe') timeframe = '1d') {
    return this.pipeline.getDataQuality(ticker, timeframe);
  }

  @Get('mtf-coverage/:ticker')
  @Public()
  @ApiOperation({ summary: 'Get multi-timeframe data coverage for ticker' })
  @ApiParam({ name: 'ticker', description: 'BIST ticker symbol' })
  async getMTFCoverage(@Param('ticker') ticker: string) {
    return this.pipeline.getMTFCoverage(ticker);
  }

  @Get('mtf-coverage')
  @Public()
  @ApiOperation({ summary: 'Get overall MTF coverage report' })
  async getOverallMTFCoverage() {
    return this.pipeline.getOverallMTFCoverage();
  }

  @Get('indicator-coverage')
  @Public()
  @ApiOperation({ summary: 'Get indicator coverage report' })
  async getIndicatorCoverage() {
    return this.pipeline.getIndicatorCoverage();
  }

  @Get('vectorbt/status')
  @Public()
  @ApiOperation({ summary: 'Get VectorBT adapter status' })
  async getVectorBTStatus() {
    return this.pipeline.getVectorBTStatus();
  }

  @Get('agent-reach/status')
  @Public()
  @ApiOperation({ summary: 'Get Agent Reach adapter status' })
  async getAgentReachStatus() {
    return this.pipeline.getAgentReachStatus();
  }

  @Post('agent-reach/search')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search company via Agent Reach' })
  @ApiBody({ schema: { properties: { ticker: { type: 'string' } } } })
  async agentReachSearchCompany(@Body() body: { ticker: string }) {
    return this.pipeline.agentReachSearchCompany(body.ticker);
  }

  @Post('agent-reach/news')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search news via Agent Reach' })
  @ApiBody({ schema: { properties: { ticker: { type: 'string' } } } })
  async agentReachSearchNews(@Body() body: { ticker: string }) {
    return this.pipeline.agentReachSearchNews(body.ticker);
  }

  @Get('full-report/:ticker')
  @Public()
  @ApiOperation({ summary: 'Get full data research report for ticker' })
  @ApiParam({ name: 'ticker', description: 'BIST ticker symbol' })
  async getFullReport(@Param('ticker') ticker: string) {
    return this.pipeline.getFullDataReport(ticker);
  }

  @Get('full-report')
  @Public()
  @ApiOperation({ summary: 'Get full data research report (all)' })
  async getFullReportAll() {
    return this.pipeline.getFullDataReport();
  }

  @Post('cache/clear')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear data research caches' })
  async clearCaches() {
    return this.pipeline.clearCaches();
  }
}
