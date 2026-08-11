import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/auth/decorators';
import { HistoricalMarketDataService } from './historical-market-data.service';
import {
  HistoricalBackfillBodyDto,
  HistoricalBulkBackfillBodyDto,
  HistoricalRangeQueryDto,
  HistoricalStatusQueryDto,
} from './historical-market-data.dto';

@ApiTags('Historical Market Data')
@Controller('market-data/history')
@Public()
export class HistoricalMarketDataController {
  constructor(private readonly historical: HistoricalMarketDataService) {}

  @Get('status')
  @ApiOperation({ summary: 'Historical coverage status for all active BIST symbols (metadata only)' })
  getAllStatus(@Query() query: HistoricalStatusQueryDto) {
    return this.historical.getAllStatus(query.timeframe ?? '1d');
  }

  @Post('backfill')
  @ApiOperation({ summary: 'Bulk backfill for multiple symbols (conservative concurrency)' })
  bulkBackfill(@Body() body: HistoricalBulkBackfillBodyDto) {
    return this.historical.backfillAll({
      symbols: body.symbols,
      timeframe: body.timeframe ?? '1d',
      startDate: body.from,
      endDate: body.to,
      force: body.force,
      concurrency: body.concurrency,
    });
  }

  @Get(':symbol/status')
  @ApiOperation({ summary: 'Historical status for a symbol' })
  getStatus(@Param('symbol') symbol: string, @Query() query: HistoricalRangeQueryDto) {
    return this.historical.getSymbolStatus(symbol, query.timeframe ?? '1d', {
      startDate: query.from,
      endDate: query.to,
    });
  }

  @Get(':symbol/gaps')
  @ApiOperation({ summary: 'Detected historical gaps and anomalies for a symbol' })
  getGaps(@Param('symbol') symbol: string, @Query() query: HistoricalRangeQueryDto) {
    return this.historical.getGaps(symbol, query.timeframe ?? '1d', {
      startDate: query.from,
      endDate: query.to,
    });
  }

  @Get(':symbol/quality')
  @ApiOperation({ summary: 'Data quality assessment for a symbol' })
  getQuality(@Param('symbol') symbol: string, @Query() query: HistoricalRangeQueryDto) {
    return this.historical.getQuality(symbol, query.timeframe ?? '1d', {
      startDate: query.from,
      endDate: query.to,
    });
  }

  @Post(':symbol/backfill')
  @ApiOperation({ summary: 'Request backfill of missing historical ranges for a symbol' })
  backfill(@Param('symbol') symbol: string, @Body() body: HistoricalBackfillBodyDto) {
    return this.historical.backfill(symbol, body.timeframe ?? '1d', {
      startDate: body.from,
      endDate: body.to,
      force: body.force,
      concurrency: body.concurrency,
    });
  }

  @Get(':symbol/backfill/status')
  @ApiOperation({ summary: 'Last backfill run status for a symbol' })
  getBackfillStatus(@Param('symbol') symbol: string, @Query() query: HistoricalStatusQueryDto) {
    return this.historical.getBackfillStatus(symbol, query.timeframe ?? '1d');
  }
}
