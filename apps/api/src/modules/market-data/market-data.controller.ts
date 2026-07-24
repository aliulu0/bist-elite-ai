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
import { MarketDataService } from './market-data.service';
import { MarketDataProviderRegistry } from './market-data.provider-registry';
import { HistoryQueryDto } from './dto';
import {
  LatestPriceResponseDto,
  HistoryResponseDto,
  TimeframesResponseDto,
  ProvidersResponseDto,
  ErrorResponseDto,
} from './dto';

@ApiTags('Market Data')
@Controller('market-data')
export class MarketDataController {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly registry: MarketDataProviderRegistry,
  ) {}

  @Get(':symbol/latest')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get latest price for a symbol' })
  @ApiResponse({ status: 200, description: 'Latest price returned', type: LatestPriceResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid symbol', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'No data found', type: ErrorResponseDto })
  @ApiResponse({ status: 503, description: 'No provider available', type: ErrorResponseDto })
  async getLatestPrice(@Param('symbol') symbol: string): Promise<LatestPriceResponseDto> {
    if (!symbol || symbol.trim().length === 0) {
      throw new BadRequestException('Symbol is required');
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    const provider = await this.registry.getActiveProvider();
    if (!provider) {
      throw new ServiceUnavailableException('No data provider available');
    }

    const data = await this.marketDataService.fetchLatest(cleanSymbol);

    if (!data) {
      throw new NotFoundException(`No data found for symbol: ${cleanSymbol}`);
    }

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
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

    if (!this.marketDataService.isTimeframeSupported(query.timeframe)) {
      throw new BadRequestException(
        `Unsupported timeframe: ${query.timeframe}. Supported: ${this.marketDataService.getSupportedTimeframes().join(', ')}`,
      );
    }

    const provider = await this.registry.getActiveProvider();
    if (!provider) {
      throw new ServiceUnavailableException('No data provider available');
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    const data = await this.marketDataService.fetchData(cleanSymbol, query.timeframe, {
      startDate: query.from,
      endDate: query.to,
    });

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      total: data.length,
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
      data: this.marketDataService.getSupportedTimeframes(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('providers')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available providers and their status' })
  @ApiResponse({ status: 200, description: 'Provider statuses', type: ProvidersResponseDto })
  async getProviders(): Promise<ProvidersResponseDto> {
    const health = await this.marketDataService.healthCheck();
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
}
