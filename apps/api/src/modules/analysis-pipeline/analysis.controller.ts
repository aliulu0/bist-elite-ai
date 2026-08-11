import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { AnalysisService } from './analysis.service';
import { AnalysisQueryDto, AnalysisResponseDto, AnalysisErrorDto } from './dto';
import { Timeframe } from '../indicators/indicator.types';

const VALID_TIMEFRAMES: readonly string[] = ['4h', '1d', '1w', '1m', '3m', '6m'];

@ApiTags('Analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get(':symbol')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run full analysis pipeline for a symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: VALID_TIMEFRAMES, example: '1d' })
  @ApiResponse({ status: 200, description: 'Full analysis returned', type: AnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: AnalysisErrorDto })
  @ApiResponse({ status: 404, description: 'No data found', type: AnalysisErrorDto })
  async analyze(
    @Param('symbol') symbol: string,
    @Query() query: AnalysisQueryDto,
  ): Promise<AnalysisResponseDto> {
    const cleanSymbol = this.validateSymbol(symbol);
    const timeframe = this.validateTimeframe(query.timeframe);

    const result = await this.analysisService.analyzeSymbol(cleanSymbol, timeframe);

    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':symbol/technical')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run technical analysis for a symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: VALID_TIMEFRAMES, example: '1d' })
  @ApiResponse({ status: 200, description: 'Technical analysis returned', type: AnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: AnalysisErrorDto })
  async analyzeTechnical(
    @Param('symbol') symbol: string,
    @Query() query: AnalysisQueryDto,
  ): Promise<AnalysisResponseDto> {
    const cleanSymbol = this.validateSymbol(symbol);
    const timeframe = this.validateTimeframe(query.timeframe);

    const result = await this.analysisService.analyzeTechnical(cleanSymbol, timeframe);

    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':symbol/financial')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run financial analysis for a symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: VALID_TIMEFRAMES, example: '1d' })
  @ApiResponse({ status: 200, description: 'Financial analysis returned', type: AnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: AnalysisErrorDto })
  async analyzeFinancial(
    @Param('symbol') symbol: string,
    @Query() query: AnalysisQueryDto,
  ): Promise<AnalysisResponseDto> {
    const cleanSymbol = this.validateSymbol(symbol);
    const timeframe = this.validateTimeframe(query.timeframe);

    const result = await this.analysisService.analyzeFinancial(cleanSymbol, timeframe);

    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':symbol/smart-money')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run smart money analysis for a symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: VALID_TIMEFRAMES, example: '1d' })
  @ApiResponse({ status: 200, description: 'Smart money analysis returned', type: AnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: AnalysisErrorDto })
  async analyzeSmartMoney(
    @Param('symbol') symbol: string,
    @Query() query: AnalysisQueryDto,
  ): Promise<AnalysisResponseDto> {
    const cleanSymbol = this.validateSymbol(symbol);
    const timeframe = this.validateTimeframe(query.timeframe);

    const result = await this.analysisService.analyzeSmartMoney(cleanSymbol, timeframe);

    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':symbol/opportunity')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run opportunity analysis for a symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: VALID_TIMEFRAMES, example: '1d' })
  @ApiResponse({ status: 200, description: 'Opportunity analysis returned', type: AnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: AnalysisErrorDto })
  async analyzeOpportunity(
    @Param('symbol') symbol: string,
    @Query() query: AnalysisQueryDto,
  ): Promise<AnalysisResponseDto> {
    const cleanSymbol = this.validateSymbol(symbol);
    const timeframe = this.validateTimeframe(query.timeframe);

    const result = await this.analysisService.analyzeOpportunity(cleanSymbol, timeframe);

    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':symbol/elite-score')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run elite score analysis for a symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: VALID_TIMEFRAMES, example: '1d' })
  @ApiResponse({ status: 200, description: 'Elite score analysis returned', type: AnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: AnalysisErrorDto })
  async analyzeEliteScore(
    @Param('symbol') symbol: string,
    @Query() query: AnalysisQueryDto,
  ): Promise<AnalysisResponseDto> {
    const cleanSymbol = this.validateSymbol(symbol);
    const timeframe = this.validateTimeframe(query.timeframe);

    const result = await this.analysisService.analyzeEliteScore(cleanSymbol, timeframe);

    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  private validateSymbol(symbol: string): string {
    if (!symbol || symbol.trim().length === 0) {
      throw new BadRequestException('Symbol is required');
    }
    return symbol.trim().toUpperCase();
  }

  private validateTimeframe(timeframe?: string): Timeframe {
    const tf = (timeframe ?? '1d') as Timeframe;
    if (!VALID_TIMEFRAMES.includes(tf)) {
      throw new BadRequestException(
        `Invalid timeframe '${tf}'. Must be one of: ${VALID_TIMEFRAMES.join(', ')}`,
      );
    }
    return tf;
  }
}
