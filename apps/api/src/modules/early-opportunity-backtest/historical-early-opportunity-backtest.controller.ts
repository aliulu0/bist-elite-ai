import { Controller, Get, Post, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { HistoricalEarlyOpportunityBacktestService } from './historical-early-opportunity-backtest.service';
import {
  EarlyOpportunityBacktestRequestDto,
  EarlyOpportunityBacktestRunDto,
  BacktestRunSummaryDto,
  BacktestRunResponseDto,
  DecisionTableRowDto,
} from './dto/early-opportunity-backtest-request.dto';
import { BacktestRunConfig, DecisionTableRow } from './early-opportunity-backtest.types';

@ApiTags('Backtest / Early Opportunity')
@Controller('backtest/early-opportunity')
export class HistoricalEarlyOpportunityBacktestController {
  constructor(private readonly service: HistoricalEarlyOpportunityBacktestService) {}

  @Get(':runId([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
  @ApiOperation({ summary: 'Backtest sonucunu getir' })
  @ApiParam({ name: 'runId' })
  async getRun(@Param('runId') runId: string): Promise<BacktestRunResponseDto> {
    const result = this.service.getRun(runId);
    if (!result) throw new NotFoundException(`Backtest çalıştırması bulunamadı: ${runId}`);
    const summary = this.service.getSummary(runId);
    const table = this.service.getDecisions(runId);
    return {
      runId: result.runId,
      completedAt: result.completedAt,
      decisionsEvaluated: result.decisions.length,
      outcomesEvaluated: result.outcomes.length,
      executionDurationMs: result.performance.executionDurationMs,
      providerCalls: result.performance.providerCalls,
      cacheHits: result.performance.cacheHits,
      summary: summary ?? {
        runId,
        decisionsEvaluated: 0,
        winRate: 0,
        averageReturn: 0,
        medianReturn: 0,
        benchmarkExcessReturn: null,
        maxDrawdown: 0,
        averageLeadTime: null,
        falsePositiveCount: 0,
        missedOpportunityCount: 0,
        sampleQuality: 'INSUFFICIENT_SAMPLE',
        survivorshipWarning: 'SURVIVORSHIP_BIAS_POSSIBLE',
        pointInTimeVerified: true,
      },
      decisionTable: table,
    };
  }

  @Get(':ticker')
  @ApiOperation({ summary: 'Belirli bir hisse için geçmiş erken fırsat değerlendirmesi' })
  @ApiParam({ name: 'ticker', example: 'THYAO.IS' })
  async getTickerSummary(
    @Param('ticker') ticker: string,
  ): Promise<{ ticker: string; message: string }> {
    return {
      ticker,
      message: `Geçmiş erken fırsat değerlendirmesi için POST /backtest/early-opportunity/run kullanın.`,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Geçmiş backtest çalıştırmalarını listele' })
  async listRuns(): Promise<{ runIds: string[] }> {
    return { runIds: [] };
  }

  @Post('run')
  @ApiOperation({ summary: 'Geçmiş erken fırsat backtest çalıştırması başlat' })
  @ApiBody({ type: EarlyOpportunityBacktestRequestDto })
  async runBacktest(
    @Body() dto: EarlyOpportunityBacktestRequestDto,
  ): Promise<EarlyOpportunityBacktestRunDto> {
    const config: BacktestRunConfig = {
      symbols: dto.symbols,
      timeframes: dto.timeframes,
      startDate: dto.startDate ?? '2024-01-01',
      endDate: dto.endDate ?? '2024-12-31',
      horizons: dto.horizons,
      minScore: dto.minScore,
      minConfidence: dto.minConfidence,
      benchmark: dto.benchmark,
      commission: dto.commission ?? 0,
      slippage: dto.slippage ?? 0,
      maxSymbols: dto.maxSymbols ?? 10,
      maxDecisions: dto.maxDecisions ?? 100,
    };

    const result = await this.service.runBacktest(config);
    return {
      runId: result.runId,
      status: 'completed',
      message: `Backtest tamamlandı. ${result.decisions.length} karar değerlendirildi.`,
      startedAt: result.startedAt,
      config: dto,
    };
  }

  @Get(':runId/summary')
  @ApiOperation({ summary: 'Backtest özetini getir' })
  @ApiParam({ name: 'runId' })
  async getSummary(@Param('runId') runId: string): Promise<BacktestRunSummaryDto> {
    const summary = this.service.getSummary(runId);
    if (!summary) throw new NotFoundException(`Backtest çalıştırması bulunamadı: ${runId}`);
    return summary;
  }

  @Get(':runId/decisions')
  @ApiOperation({ summary: 'Karar tablosunu getir' })
  @ApiParam({ name: 'runId' })
  async getDecisions(@Param('runId') runId: string): Promise<DecisionTableRowDto[]> {
    return this.service.getDecisions(runId);
  }

  @Get(':runId/failures')
  @ApiOperation({ summary: 'Yanlış pozitifleri getir' })
  @ApiParam({ name: 'runId' })
  async getFailures(@Param('runId') runId: string) {
    const result = this.service.getFailures(runId);
    if (!result) throw new NotFoundException(`Backtest çalıştırması bulunamadı: ${runId}`);
    return result;
  }

  @Get(':runId/missed-opportunities')
  @ApiOperation({ summary: 'Kaçırılan fırsatları getir' })
  @ApiParam({ name: 'runId' })
  async getMissedOpportunities(@Param('runId') runId: string) {
    const result = this.service.getMissedOpportunities(runId);
    if (!result) throw new NotFoundException(`Backtest çalıştırması bulunamadı: ${runId}`);
    return result;
  }

  @Get(':runId/calibration')
  @ApiOperation({ summary: 'Güven kalibrasyonunu getir' })
  @ApiParam({ name: 'runId' })
  async getCalibration(@Param('runId') runId: string) {
    const result = this.service.getCalibration(runId);
    if (!result) throw new NotFoundException(`Backtest çalıştırması bulunamadı: ${runId}`);
    return result;
  }

  @Get(':runId/lead-time')
  @ApiOperation({ summary: 'Erken tespit süresini getir' })
  @ApiParam({ name: 'runId' })
  async getLeadTime(@Param('runId') runId: string) {
    const result = this.service.getLeadTime(runId);
    if (!result) throw new NotFoundException(`Backtest çalıştırması bulunamadı: ${runId}`);
    return result;
  }
}
