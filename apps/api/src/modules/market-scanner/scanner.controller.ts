import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { ScannerService } from './scanner.service';
import {
  ScannerQueryDto,
  ScannerFullResponseDto,
  ScannerPageDto,
  ScannerStatisticsDto,
  ScannerErrorDto,
} from './dto';

@ApiTags('Scanner')
@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full scanner results' })
  @ApiResponse({ status: 200, description: 'Full scan results', type: ScannerFullResponseDto })
  @ApiResponse({ status: 404, description: 'No scan data', type: ScannerErrorDto })
  getFullScan(): ScannerFullResponseDto {
    const result = this.scannerService.getResult();
    if (!result) {
      throw new NotFoundException('No scan data available. Run a scan first.');
    }

    return {
      success: true,
      topCandidates: result.topCandidates,
      watchlist: result.watchlist,
      rejected: result.rejected,
      statistics: result.statistics,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('top')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get top candidates with pagination' })
  @ApiResponse({ status: 200, description: 'Top candidates', type: ScannerPageDto })
  @ApiResponse({ status: 404, description: 'No scan data', type: ScannerErrorDto })
  getTop(@Query() query: ScannerQueryDto): ScannerPageDto {
    this.ensureScanData();

    return this.scannerService.getTopCandidates(
      query.offset ?? 0,
      query.limit ?? 10,
      (query.sortBy as any) ?? 'compositeScore',
      query.sortDir ?? 'desc',
    );
  }

  @Get('watchlist')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get watchlist with pagination' })
  @ApiResponse({ status: 200, description: 'Watchlist', type: ScannerPageDto })
  @ApiResponse({ status: 404, description: 'No scan data', type: ScannerErrorDto })
  getWatchlist(@Query() query: ScannerQueryDto): ScannerPageDto {
    this.ensureScanData();

    return this.scannerService.getWatchlist(
      query.offset ?? 0,
      query.limit ?? 20,
      (query.sortBy as any) ?? 'compositeScore',
      query.sortDir ?? 'desc',
    );
  }

  @Get('rejected')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get rejected symbols with pagination' })
  @ApiResponse({ status: 200, description: 'Rejected symbols', type: ScannerPageDto })
  @ApiResponse({ status: 404, description: 'No scan data', type: ScannerErrorDto })
  getRejected(@Query() query: ScannerQueryDto): ScannerPageDto {
    this.ensureScanData();

    return this.scannerService.getRejected(
      query.offset ?? 0,
      query.limit ?? 50,
      (query.sortBy as any) ?? 'compositeScore',
      query.sortDir ?? 'desc',
    );
  }

  @Get('statistics')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get scan statistics' })
  @ApiResponse({ status: 200, description: 'Scan statistics', type: ScannerStatisticsDto })
  @ApiResponse({ status: 404, description: 'No scan data', type: ScannerErrorDto })
  getStatistics(): ScannerStatisticsDto {
    const stats = this.scannerService.getStatistics();
    if (!stats) {
      throw new NotFoundException('No scan data available. Run a scan first.');
    }
    return stats;
  }

  private ensureScanData(): void {
    if (!this.scannerService.getResult()) {
      throw new NotFoundException('No scan data available. Run a scan first.');
    }
  }
}
