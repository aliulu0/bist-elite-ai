import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { BacktestService } from './backtest.service';
import { BacktestRequestDto } from './dto/backtest-request.dto';
import { BacktestResponseDto } from './dto/backtest-response.dto';
import {
  StrategyRankingDto,
  PortfolioSignalDto,
  TomorrowFeedbackResultDto,
  EliteScoreWeightDeltaDto,
  BacktestReportDto,
} from './dto/strategy-ranking.dto';
import { LearningReportDto } from './dto/learning-report.dto';
import { Timeframe } from '../indicators/indicator.types';

@ApiTags('Backtest')
@Controller('backtest')
export class BacktestController {
  constructor(private readonly backtestService: BacktestService) {}

  @Get('run')
  @Public()
  @ApiOperation({ summary: 'Backtest çalıştır (GET, sorgu parametreleri)' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Hisse sembolü', example: 'THYAO.IS' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['4h', '1d', '1w', '1m', '3m', '6m'], example: '1d' })
  @ApiQuery({ name: 'backtestType', required: false, enum: ['indicator', 'strategy', 'momentum', 'indicator', 'portfolio', 'multi-factor'], example: 'indicator' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '10Y', 'max'], example: '1Y' })
  @ApiResponse({ status: 200, type: BacktestResponseDto })
  async runBacktestGet(@Query() dto: BacktestRequestDto): Promise<BacktestResponseDto> {
    return this.backtestService.runBacktest(dto);
  }

  @Post('run')
  @Public()
  @ApiOperation({ summary: 'Backtest çalıştır (POST, JSON body)' })
  @ApiResponse({ status: 201, type: BacktestResponseDto })
  @ApiResponse({ status: 400, description: 'Geçersiz istek' })
  @ApiResponse({ status: 404, description: 'Veri bulunamadı' })
  async runBacktestPost(@Body() dto: BacktestRequestDto): Promise<BacktestResponseDto> {
    return this.backtestService.runBacktest(dto);
  }

  @Get('report/:symbol')
  @Public()
  @ApiOperation({ summary: 'Kayıtlı backtest raporunu getir' })
  @ApiParam({ name: 'symbol', example: 'THYAO.IS' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['4h', '1d', '1w', '1m', '3m', '6m'], example: '1d' })
  @ApiQuery({ name: 'backtestType', required: false, enum: ['indicator', 'strategy', 'momentum', 'portfolio', 'multi-factor'], example: 'indicator' })
  @ApiResponse({ status: 200, type: BacktestReportDto })
  @ApiResponse({ status: 404, description: 'Kayıt bulunamadı' })
  getReport(@Param('symbol') symbol: string, @Query('timeframe') timeframe: Timeframe = '1d', @Query('backtestType') backtestType = 'indicator'): BacktestReportDto {
    return this.backtestService.getReport(symbol, timeframe, backtestType);
  }

  @Get('learning/:symbol')
  @Public()
  @ApiOperation({ summary: 'Sembol için öğrenme raporunu getir' })
  @ApiParam({ name: 'symbol', example: 'THYAO.IS' })
  @ApiResponse({ status: 200, type: LearningReportDto })
  @ApiResponse({ status: 404, description: 'Kayıt bulunamadı' })
  getLearning(@Param('symbol') symbol: string): LearningReportDto {
    return this.backtestService.getLearning(symbol);
  }

  @Get('strategies')
  @Public()
  @ApiOperation({ summary: 'Strateji sıralamasını (ranking) getir' })
  @ApiResponse({ status: 200, type: [StrategyRankingDto] })
  getStrategyRankings(): StrategyRankingDto[] {
    return this.backtestService.getStrategyRankings();
  }

  @Get('portfolio/:symbol')
  @Public()
  @ApiOperation({ summary: 'Backtest sonucuna göre portföy sinyallerini getir' })
  @ApiParam({ name: 'symbol', example: 'THYAO.IS' })
  @ApiResponse({ status: 200, type: [PortfolioSignalDto] })
  getPortfolioSignals(@Param('symbol') symbol: string): PortfolioSignalDto[] {
    return this.backtestService.getPortfolioSignals(symbol);
  }

  @Get('tomorrow/:symbol')
  @Public()
  @ApiOperation({ summary: 'Yesterday tahminine göre bugünkü feedback; güveni güncelle' })
  @ApiParam({ name: 'symbol', example: 'THYAO.IS' })
  @ApiQuery({ name: 'predictedScore', required: true, type: Number, example: 7 })
  @ApiQuery({ name: 'actualReturn', required: true, type: Number, example: 5 })
  @ApiResponse({ status: 200, type: TomorrowFeedbackResultDto })
  getTomorrowFeedback(
    @Param('symbol') symbol: string,
    @Query('predictedScore') predictedScore = '0',
    @Query('actualReturn') actualReturn = '0',
  ): TomorrowFeedbackResultDto {
    return this.backtestService.applyTomorrowFeedback(symbol, Number(predictedScore), Number(actualReturn));
  }

  @Get('elite-score/:symbol')
  @Public()
  @ApiOperation({ summary: 'Backtest istatistiklerine göre Elite Score ağırlık deltayını getir' })
  @ApiParam({ name: 'symbol', example: 'THYAO.IS' })
  @ApiResponse({ status: 200, type: EliteScoreWeightDeltaDto })
  getEliteScoreWeightDelta(@Param('symbol') symbol: string): EliteScoreWeightDeltaDto {
    return this.backtestService.getEliteScoreWeightDelta(symbol);
  }
}
