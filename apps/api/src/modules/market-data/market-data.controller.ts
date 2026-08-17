import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import {
  MarketDataOrchestrator,
  ProviderDashboardEntry,
} from './orchestrator/market-data-orchestrator';
import { MarketTruthService } from './services/market-truth.service';
import { IncrementalMarketDataService } from './incremental/incremental-market-data.service';
import { LatestPriceIncrementalService } from './incremental/latest-price-incremental.service';
import { MarketDataHealthService } from './health/market-data-health.service';
import { CoverageReportService } from './coverage/coverage-report.service';
import { MarketDataHealthReport } from './health/provider-health.types';
import { CoverageReport } from './coverage/coverage-report.types';
import { SUPPORTED_TIMEFRAMES, Timeframe } from './interfaces';
import { HistoryQueryDto } from './dto';
import {
  LatestPriceResponseDto,
  HistoryResponseDto,
  TimeframesResponseDto,
  ProvidersResponseDto,
  ProviderConfigurationResponseDto,
  ErrorResponseDto,
  TruthResponseDto,
} from './dto';

@ApiTags('Market Data')
@Controller('market-data')
export class MarketDataController {
  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    @Optional() private readonly marketTruth: MarketTruthService | undefined,
    private readonly incremental: IncrementalMarketDataService,
    private readonly latestPriceIncremental: LatestPriceIncrementalService,
    private readonly healthService: MarketDataHealthService,
    private readonly coverageService: CoverageReportService,
  ) {}

  @Get('providers/dashboard')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get provider observability dashboard' })
  @ApiResponse({ status: 200, description: 'Provider dashboard entries' })
  getProviderDashboard(): Array<ProviderDashboardEntry & { timestamp: string }> {
    return this.orchestrator.getProviderDashboard().map((entry) => ({
      ...entry,
      timestamp: new Date().toISOString(),
    }));
  }

  @Get('providers/configuration')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get provider configuration status (no secrets)' })
  @ApiResponse({
    status: 200,
    description: 'Provider configuration statuses',
    type: ProviderConfigurationResponseDto,
  })
  getProviderConfiguration(): ProviderConfigurationResponseDto {
    return {
      success: true,
      data: this.orchestrator.getProviderConfiguration(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':symbol/latest')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get latest price for a symbol' })
  @ApiResponse({ status: 200, description: 'Latest price returned', type: LatestPriceResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid symbol', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'No data found', type: ErrorResponseDto })
  @ApiResponse({ status: 503, description: 'No provider available', type: ErrorResponseDto })
  async getLatestPrice(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe?: string,
  ): Promise<LatestPriceResponseDto> {
    if (!symbol || symbol.trim().length === 0) {
      throw new BadRequestException('Symbol is required');
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanTimeframe = timeframe?.trim().toLowerCase();

    if (
      cleanTimeframe &&
      !SUPPORTED_TIMEFRAMES.includes(cleanTimeframe as Timeframe) &&
      cleanTimeframe !== '1h' &&
      cleanTimeframe !== '2h'
    ) {
      throw new BadRequestException(
        `Unsupported timeframe: ${cleanTimeframe}. Supported: ${SUPPORTED_TIMEFRAMES.join(', ')}`,
      );
    }

    if (this.orchestrator.getAvailableProviders().length === 0) {
      throw new ServiceUnavailableException('No data provider available');
    }

    // R2-041: timeframe-aware incremental latest price with freshness + dedup.
    if (cleanTimeframe) {
      const state = await this.latestPriceIncremental.getLatestPriceIncremental(
        cleanSymbol,
        cleanTimeframe,
      );
      if (!state) {
        throw new NotFoundException(`No data found for symbol: ${cleanSymbol}`);
      }

      return {
        success: true,
        data: {
          symbol: state.symbol,
          timeframe: state.timeframe as Timeframe,
          open: state.previousPrice,
          high: Math.max(state.price, state.previousPrice),
          low: Math.min(state.price, state.previousPrice),
          close: state.price,
          volume: 0,
          timestamp: state.timestamp,
          validationStatus: 'valid',
        },
        timestamp: new Date().toISOString(),
        symbol: state.symbol,
        price: state.price,
        previousPrice: state.previousPrice,
        change: state.change,
        changePercent: state.changePercent,
        provider: state.provider,
        sourceTimeframe: state.sourceTimeframe,
        dataFreshness: state.dataFreshness as 'fresh' | 'stale' | 'no-data',
        cached: state.dataFreshness !== 'no-data' && state.provider === 'cache',
        lastSuccessfulUpdate: state.lastSuccessfulUpdate,
        freshnessMessage: this.latestPriceIncremental.getFreshnessMessage(state.dataFreshness),
      };
    }

    const result = await this.orchestrator.fetchLatestPrice(cleanSymbol);

    if (!result || !result.data) {
      throw new NotFoundException(`No data found for symbol: ${cleanSymbol}`);
    }

    const point = result.data;
    const change = point.close - point.open;
    const changePercent = point.open !== 0 ? (change / point.open) * 100 : 0;

    return {
      success: true,
      data: point,
      timestamp: new Date().toISOString(),
      symbol: point.symbol,
      price: point.close,
      previousPrice: point.open,
      change,
      changePercent,
      provider: result.provider,
      sourceTimeframe: point.timeframe,
      dataFreshness: 'fresh',
      cached: result.cached ?? false,
      lastSuccessfulUpdate: new Date().toISOString(),
      freshnessMessage: this.latestPriceIncremental.getFreshnessMessage('fresh'),
    };
  }

  @Get(':symbol/history')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get historical price data for a symbol' })
  @ApiResponse({ status: 200, description: 'Historical data returned', type: HistoryResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid parameters', type: ErrorResponseDto })
  @ApiResponse({ status: 503, description: 'No provider available', type: ErrorResponseDto })
  async getHistory(
    @Param('symbol') symbol: string,
    @Query() query: HistoryQueryDto,
  ): Promise<HistoryResponseDto> {
    if (!symbol || symbol.trim().length === 0) {
      throw new BadRequestException('Symbol is required');
    }

    if (!SUPPORTED_TIMEFRAMES.includes(query.timeframe as Timeframe)) {
      throw new BadRequestException(
        `Unsupported timeframe: ${query.timeframe}. Supported: ${SUPPORTED_TIMEFRAMES.join(', ')}`,
      );
    }

    if (this.orchestrator.getAvailableProviders().length === 0) {
      throw new ServiceUnavailableException('No data provider available');
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    const result = await this.incremental.fetchHistoricalData(cleanSymbol, query.timeframe, {
      startDate: query.from,
      endDate: query.to,
    });

    const data = result ? result.data : [];

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      total: data.length,
      provider: result?.provider,
      cached: result?.cached ?? false,
      sourceTimeframe: result?.sourceTimeframe ?? null,
      incremental: result?.incremental,
    };
  }

  @Get('timeframes')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get supported timeframes' })
  @ApiResponse({ status: 200, description: 'Supported timeframes', type: TimeframesResponseDto })
  getTimeframes(): TimeframesResponseDto {
    return {
      success: true,
      data: this.orchestrator.getSupportedTimeframes(),
      details: this.orchestrator.getTimeframeStatusReport(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('providers')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available providers and their status' })
  @ApiResponse({ status: 200, description: 'Provider statuses', type: ProvidersResponseDto })
  async getProviders(): Promise<ProvidersResponseDto> {
    const health = await this.orchestrator.getProviderHealth();
    const providers = Object.entries(health).map(([name, healthy]) => ({
      name,
      healthy,
    }));

    return {
      success: true,
      data: providers,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get provider health report (no live probes)' })
  @ApiResponse({ status: 200, description: 'Provider health report' })
  getHealth(): MarketDataHealthReport {
    return this.healthService.getHealthReport();
  }

  @Get('coverage')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get data coverage report' })
  @ApiResponse({ status: 200, description: 'Data coverage report' })
  getCoverage(): CoverageReport {
    return this.coverageService.generate();
  }

  @Get(':ticker/truth')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get multi-source market truth and price consensus' })
  @ApiResponse({
    status: 200,
    description: 'Market truth consensus result',
    type: TruthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid ticker', type: ErrorResponseDto })
  @ApiResponse({ status: 503, description: 'No providers available', type: ErrorResponseDto })
  async getMarketTruth(@Param('ticker') ticker: string): Promise<TruthResponseDto> {
    if (!ticker || ticker.trim().length === 0) {
      throw new ErrorResponseDto('Invalid ticker', 400);
    }

    const cleanSymbol = ticker.trim().toUpperCase();
    const availableProviders = this.orchestrator.getAvailableProviders();
    if (availableProviders.length === 0) {
      throw new ErrorResponseDto('No data provider available', 503);
    }

    let truth: ConsensusResult;
    if (this.marketTruth) {
      truth = await this.marketTruth.getMarketTruth(cleanSymbol);
    } else {
      // Fallback: single source verified using Yahoo only
      truth = {
        consensusPrice: null,
        consensusCurrency: null,
        status: 'SINGLE_SOURCE_UNAVAILABLE' as const,
        confidence: 'NONE' as const,
        sources: [],
        freshness: 'UNKNOWN',
        generatedAt: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: {
        ticker: cleanSymbol,
        consensusPrice: truth.consensusPrice,
        consensusCurrency: truth.consensusCurrency,
        status: truth.status,
        confidence: truth.confidence,
        sources: truth.sources.map((s) => ({
          provider: s.provider,
          providerSymbol: s.providerSymbol,
          price: s.price,
          currency: s.currency,
          timestamp: s.timestamp,
          freshness: s.freshnessSeconds !== null ? `${s.freshnessSeconds}s ago` : null,
          validationStatus: s.validationStatus,
          source: s.source,
        })),
        conflict: truth.conflict
          ? {
              detected: truth.conflict.detected,
              maxDifference: truth.conflict.maxDifference,
              maxDifferencePercent: truth.conflict.maxDifferencePercent,
              contributingSources: truth.conflict.contributingSources,
            }
          : undefined,
        freshness: truth.freshness,
        generatedAt: truth.generatedAt,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
