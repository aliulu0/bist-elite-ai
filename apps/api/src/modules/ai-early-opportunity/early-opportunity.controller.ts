import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { EarlyOpportunityIntelligenceService } from './early-opportunity.intelligence.service';
import {
  EarlyOpportunityIntelligenceDto,
  EarlyOpportunityIntelligenceScanDto,
  SelfLearningReportDto,
  FinancialDataQualityReportDto,
} from './dto/early-opportunity.dto';
import { EarlyOpportunityFilters, RiskLevel } from './early-opportunity.types';
import { SignalCategory } from './signals/early-signal.types';

@ApiTags('Early Opportunity Intelligence')
@Controller('early-opportunities')
export class EarlyOpportunityIntelligenceController {
  constructor(private readonly intelligence: EarlyOpportunityIntelligenceService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Top 10 early opportunities across ALL BIST symbols (reuses existing engines)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'minEarlyOpportunityScore', required: false, type: Number })
  @ApiQuery({ name: 'minConfidence', required: false, type: Number })
  @ApiQuery({ name: 'minExpectedReturn', required: false, type: Number })
  @ApiQuery({ name: 'maxRisk', required: false, enum: ['low', 'medium', 'high'] })
  @ApiQuery({ name: 'sector', required: false, type: String })
  @ApiQuery({ name: 'minEliteScore', required: false, type: Number })
  @ApiQuery({ name: 'minSmartMoneyScore', required: false, type: Number })
  @ApiQuery({ name: 'minFinancialDataQuality', required: false, type: Number })
  @ApiQuery({ name: 'financialDataStatus', required: false, enum: ['DATA_VERIFIED', 'DATA_ACCEPTABLE', 'DATA_WARNING', 'DATA_INSUFFICIENT', 'ANY'] })
  @ApiQuery({ name: 'freshnessStatus', required: false, enum: ['fresh', 'stale', 'unknown', 'ANY'] })
  @ApiQuery({ name: 'providerConsistency', required: false, enum: ['consistent', 'partial', 'conflicting', 'ANY'] })
  @ApiQuery({ name: 'minSignalStrength', required: false, type: Number, example: 65 })
  @ApiQuery({ name: 'minSignalConvergence', required: false, type: Number, example: 60 })
  @ApiQuery({ name: 'signalCategory', required: false, enum: ['PRICE_VOLUME', 'SMART_MONEY', 'FUNDAMENTAL', 'CATALYST', 'MULTI_TIMEFRAME', 'MARKET_STRUCTURE'] })
  @ApiQuery({ name: 'signalType', required: false, type: String, example: 'accumulation' })
  @ApiQuery({ name: 'earlyOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'confirmedOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'minDecisionScore', required: false, type: Number, example: 60 })
  @ApiQuery({ name: 'decisionStatus', required: false, enum: ['STRONG_EARLY_OPPORTUNITY', 'EARLY_OPPORTUNITY', 'WATCHLIST_OPPORTUNITY', 'CONFIRMED_OPPORTUNITY', 'EXTENDED_OPPORTUNITY', 'WEAK_OPPORTUNITY', 'INVALID_OPPORTUNITY'] })
  @ApiQuery({ name: 'earlyOpportunityOnly', required: false, type: Boolean })
  async scan(
    @Query('limit') limit?: string,
    @Query('minEarlyOpportunityScore') minEarlyOpportunityScore?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minExpectedReturn') minExpectedReturn?: string,
    @Query('maxRisk') maxRisk?: string,
    @Query('sector') sector?: string,
    @Query('minEliteScore') minEliteScore?: string,
    @Query('minSmartMoneyScore') minSmartMoneyScore?: string,
    @Query('minFinancialDataQuality') minFinancialDataQuality?: string,
    @Query('financialDataStatus') financialDataStatus?: string,
    @Query('freshnessStatus') freshnessStatus?: string,
    @Query('providerConsistency') providerConsistency?: string,
    @Query('minSignalStrength') minSignalStrength?: string,
    @Query('minSignalConvergence') minSignalConvergence?: string,
    @Query('signalCategory') signalCategory?: string,
    @Query('signalType') signalType?: string,
    @Query('earlyOnly') earlyOnly?: string,
    @Query('confirmedOnly') confirmedOnly?: string,
    @Query('minDecisionScore') minDecisionScore?: string,
    @Query('decisionStatus') decisionStatus?: string,
    @Query('earlyOpportunityOnly') earlyOpportunityOnly?: string,
  ): Promise<EarlyOpportunityIntelligenceScanDto> {
    const filters: EarlyOpportunityFilters = {
      minEarlyOpportunityScore: minEarlyOpportunityScore ? Number(minEarlyOpportunityScore) : undefined,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
      minExpectedReturn: minExpectedReturn ? Number(minExpectedReturn) : undefined,
      maxRisk: maxRisk as RiskLevel | undefined,
      sector: sector,
      minEliteScore: minEliteScore ? Number(minEliteScore) : undefined,
      minSmartMoneyScore: minSmartMoneyScore ? Number(minSmartMoneyScore) : undefined,
      minFinancialDataQuality: minFinancialDataQuality ? Number(minFinancialDataQuality) : undefined,
      financialDataStatus: financialDataStatus as EarlyOpportunityFilters['financialDataStatus'] | undefined,
      freshnessStatus: freshnessStatus as EarlyOpportunityFilters['freshnessStatus'] | undefined,
      providerConsistency: providerConsistency as EarlyOpportunityFilters['providerConsistency'] | undefined,
      minSignalStrength: minSignalStrength ? Number(minSignalStrength) : undefined,
      minSignalConvergence: minSignalConvergence ? Number(minSignalConvergence) : undefined,
      signalCategory: signalCategory as SignalCategory | undefined,
      signalType: signalType || undefined,
      earlyOnly: earlyOnly === 'true' ? true : undefined,
      confirmedOnly: confirmedOnly === 'true' ? true : undefined,
      minDecisionScore: minDecisionScore ? Number(minDecisionScore) : undefined,
      decisionStatus: decisionStatus as EarlyOpportunityFilters['decisionStatus'] | undefined,
      earlyOpportunityOnly: earlyOpportunityOnly === 'true' ? true : undefined,
    };
    const results = await this.intelligence.getEarlyOpportunities(filters, {
      limit: limit ? Number(limit) : 10,
    });
    const dto = new EarlyOpportunityIntelligenceScanDto();
    dto.results = results.map(EarlyOpportunityIntelligenceDto.from);
    dto.total = results.length;
    dto.generatedAt = new Date().toISOString();
    return dto;
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Get full early-opportunity intelligence for a single ticker' })
  async getOne(
    @Param('ticker') ticker: string,
  ): Promise<EarlyOpportunityIntelligenceDto | null> {
    const result = await this.intelligence.getEarlyOpportunity(ticker);
    return result ? EarlyOpportunityIntelligenceDto.from(result) : null;
  }

  @Get('explain/:ticker')
  @Public()
  @ApiOperation({ summary: 'Deterministic Turkish explanation of why a ticker was selected' })
  async explain(@Param('ticker') ticker: string, @Query('risk') risk?: string): Promise<{ ticker: string; explanation: string | null }> {
    void risk;
    const explanation = await this.intelligence.explain(ticker);
    return { ticker, explanation };
  }

  @Get('data-quality/:ticker')
  @Public()
  @ApiOperation({ summary: 'Get financial data quality report for a ticker' })
  async getDataQuality(@Param('ticker') ticker: string): Promise<FinancialDataQualityReportDto | null> {
    const result = await this.intelligence.getEarlyOpportunity(ticker);
    if (!result?.financialDataQuality) return null;
    return FinancialDataQualityReportDto.from(result.financialDataQuality);
  }

  @Get('data-quality/:ticker/explain')
  @Public()
  @ApiOperation({ summary: 'Deterministic Turkish explanation of data quality' })
  async explainDataQuality(@Param('ticker') ticker: string): Promise<{ ticker: string; explanation: string | null }> {
    const explanation = await this.intelligence.explainDataQuality(ticker);
    return { ticker, explanation };
  }

  @Get('learning/run')
  @Public()
  @ApiOperation({ summary: 'Run nightly self-learning cycle (reuses Backtest Engine via PredictionRegistry)' })
  async runLearning(): Promise<SelfLearningReportDto> {
    const report = await this.intelligence.runLearningCycle();
    const dto = new SelfLearningReportDto();
    dto.scanned = report.scanned;
    dto.updated = report.updated;
    dto.generatedAt = report.generatedAt;
    return dto;
  }
}
