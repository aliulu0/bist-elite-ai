import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { TechnicalAnalysisService } from './technical-analysis.service';
import { TechnicalAnalysisInputDto } from './dto';
import {
  TechnicalAnalysisResponseDto,
  TechnicalAnalysisErrorDto,
} from './dto';
import { Timeframe } from '../indicators/indicator.types';

const VALID_TIMEFRAMES: readonly string[] = ['4h', '1d', '1w', '1m', '3m', '6m'];

@ApiTags('Technical Analysis')
@Controller('technical-analysis')
export class TechnicalAnalysisController {
  constructor(private readonly analysisService: TechnicalAnalysisService) {}

  @Get(':symbol')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get technical analysis for a symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: VALID_TIMEFRAMES, example: '1d' })
  @ApiResponse({ status: 200, description: 'Technical analysis returned', type: TechnicalAnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: TechnicalAnalysisErrorDto })
  async analyze(
    @Param('symbol') symbol: string,
    @Query() query: TechnicalAnalysisInputDto,
  ): Promise<TechnicalAnalysisResponseDto> {
    if (!symbol || symbol.trim().length === 0) {
      throw new BadRequestException('Symbol is required');
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const timeframe = (query.timeframe ?? '1d') as Timeframe;

    if (!VALID_TIMEFRAMES.includes(timeframe)) {
      throw new BadRequestException(
        `Invalid timeframe '${timeframe}'. Must be one of: ${VALID_TIMEFRAMES.join(', ')}`,
      );
    }

    const result = await this.analysisService.analyze(cleanSymbol, timeframe);

    return {
      ...result,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}
