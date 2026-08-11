import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { ScannerService } from './scanner.service';
import { getDecisionStrength } from '../decision/decision-rules';
import { DecisionId } from '../decision/decision.types';
import { ScannerQueryDto, StrategyParamDto } from './dto/scanner-query.dto';
import {
  ScannerOverviewDto,
  ScannerResultsResponseDto,
  ScannerRunResponseDto,
  ScannerTopResponseDto,
  ScannerFilterResponseDto,
  StrategyInfoDto,
  ScannerResultDto,
} from './dto/scanner-response.dto';

@ApiTags('Tarama')
@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tarama genel bakışı' })
  @ApiResponse({ status: 200, description: 'Tarama genel bakışı', type: ScannerOverviewDto })
  getOverview(): ScannerOverviewDto {
    return this.scannerService.getOverview();
  }

  @Get('list')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kayıtlı strateji listesi' })
  @ApiResponse({ status: 200, description: 'Strateji listesi', type: [StrategyInfoDto] })
  getStrategyList(): StrategyInfoDto[] {
    return this.scannerService.getStrategyList();
  }

  @Get('run')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tüm stratejilerle tarama çalıştırır' })
  @ApiQuery({ name: 'sector', required: false, description: 'Sektör filtresi', example: 'Gıda' })
  @ApiQuery({ name: 'assetType', required: false, description: 'Varlık türü filtresi', example: 'Equity' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 50 })
  @ApiQuery({ name: 'activeOnly', required: false, description: 'Sadece aktif hisseler', example: true })
  @ApiResponse({ status: 200, description: 'Tarama Sonuçları', type: ScannerRunResponseDto })
  @ApiResponse({ status: 404, description: 'Strateji Bulunamadı' })
  async runScan(
    @Query() query: ScannerQueryDto,
  ): Promise<ScannerRunResponseDto> {
    try {
      const strategies = this.scannerService.getStrategyList();
      const results: ScannerResultDto[] = [];
      let totalDurationMs = 0;
      let totalScanned = 0;
      let totalResults = 0;

      for (const strategy of strategies) {
        if (!strategy.enabled) continue;
        const scan = await this.scannerService.runScan(strategy.id, {
          sector: query.sector ?? null,
          assetType: query.assetType as any ?? null,
          limit: query.limit,
          activeOnly: query.activeOnly ?? true,
        });
        totalDurationMs += scan.summary.durationMs;
        totalScanned += scan.summary.scannedCount;
        totalResults += scan.results.length;
        for (const r of scan.results) {
          results.push(this.toResultDto(r));
        }
      }

      results.sort((a, b) => {
        const decisionDiff =
          getDecisionStrength((b.decision?.decision ?? 'BEKLE') as DecisionId) -
          getDecisionStrength((a.decision?.decision ?? 'BEKLE') as DecisionId);
        if (decisionDiff !== 0) return decisionDiff;
        const scoreDiff = (b.aiScore ?? 0) - (a.aiScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.aiConfidence ?? 0) - (a.aiConfidence ?? 0);
      });

      const avgAiScore =
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.aiScore ?? 0), 0) / results.length
          : null;
      const avgAiConfidence =
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.aiConfidence ?? 0), 0) / results.length
          : null;

      return {
        baslik: 'Tarama Sonuçları',
        hisseSayisi: totalResults,
        taramaSuresi: totalDurationMs,
        ortalamaYapayZekaPuani: avgAiScore != null ? Math.round(avgAiScore) : null,
        ortalamaYapayZekaGuveni: avgAiConfidence != null ? Math.round(avgAiConfidence) : null,
        toplamTaranan: totalScanned,
        sonuclar: results.slice(0, query.limit ?? 100),
      };
    } catch (error) {
      throw new NotFoundException(
        `Tarama hatası: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Get('strategy/:strategy')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirtilen strateji ile tarama çalıştırır' })
  @ApiParam({ name: 'strategy', description: 'Strateji kimliği', example: 'value-hunter' })
  @ApiQuery({ name: 'sector', required: false, description: 'Sektör filtresi', example: 'Gıda' })
  @ApiQuery({ name: 'assetType', required: false, description: 'Varlık türü filtresi', example: 'Equity' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 50 })
  @ApiQuery({ name: 'activeOnly', required: false, description: 'Sadece aktif hisseler', example: true })
  @ApiResponse({ status: 200, description: 'Tarama Sonuçları', type: ScannerResultsResponseDto })
  @ApiResponse({ status: 404, description: 'Strateji Bulunamadı' })
  async runStrategy(
    @Param() params: StrategyParamDto,
    @Query() query: ScannerQueryDto,
  ): Promise<ScannerResultsResponseDto> {
    try {
      const scan = await this.scannerService.runScan(params.strategy, {
        sector: query.sector ?? null,
        assetType: query.assetType as any ?? null,
        limit: query.limit,
        activeOnly: query.activeOnly ?? true,
      });
      return this.toResponse(
        scan.results.map((r) => this.toResultDto(r)),
        scan.summary.durationMs,
        scan.summary.scannedCount,
      );
    } catch (error) {
      throw new NotFoundException(
        `Strateji Bulunamadı: ${params.strategy}. Mevcut stratejiler için /scanner/list kullanın.`,
      );
    }
  }

  @Get('top')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En yüksek AI puanlı hisseler' })
  @ApiQuery({ name: 'strategy', required: false, description: 'Strateji filtresi', example: 'value-hunter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 10 })
  @ApiResponse({ status: 200, description: 'En yüksek AI puanlı hisseler', type: ScannerTopResponseDto })
  getTop(@Query() query: ScannerQueryDto): ScannerTopResponseDto {
    const limit = query.limit ?? 10;
    const top = this.scannerService.getTopResults(query.strategy, limit);
    const avgAiScore =
      top.length > 0
        ? top.reduce((sum, r) => sum + (r.aiScore ?? 0), 0) / top.length
        : null;
    const avgAiConfidence =
      top.length > 0
        ? top.reduce((sum, r) => sum + (r.aiConfidence ?? 0), 0) / top.length
        : null;

    return {
      baslik: 'En Yüksek AI Puanlı Hisse Senetleri',
      toplamHisse: top.length,
      ortalamaYapayZekaPuani: avgAiScore != null ? Math.round(avgAiScore) : null,
      ortalamaYapayZekaGuveni: avgAiConfidence != null ? Math.round(avgAiConfidence) : null,
      sonuclar: top,
    };
  }

  @Get('filter')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI skor ve güven filtreleriyle tarama sonuçlarını filtreler' })
  @ApiQuery({ name: 'minAiScore', required: false, description: 'Minimum AI Skoru', example: 50 })
  @ApiQuery({ name: 'minConfidence', required: false, description: 'Minimum AI Güveni', example: 60 })
  @ApiQuery({ name: 'minStrategyScore', required: false, description: 'Minimum Strateji Skoru', example: 50 })
  @ApiQuery({ name: 'sector', required: false, description: 'Sektör filtresi', example: 'Gıda' })
  @ApiQuery({ name: 'assetType', required: false, description: 'Varlık türü filtresi', example: 'Equity' })
  @ApiQuery({ name: 'activeOnly', required: false, description: 'Sadece aktif hisseler', example: true })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 50 })
  @ApiResponse({ status: 200, description: 'Filtrelenmiş tarama sonuçları', type: ScannerFilterResponseDto })
  filter(@Query() query: ScannerQueryDto): ScannerFilterResponseDto {
    const request = {
      minAiScore: query.minAiScore as number | undefined,
      minConfidence: query.minConfidence as number | undefined,
      minStrategyScore: query.minStrategyScore as number | undefined,
      sector: query.sector ?? undefined,
      assetType: query.assetType as string | undefined,
      activeOnly: query.activeOnly ?? true,
      limit: query.limit ?? undefined,
    };
    const response = this.scannerService.filterResults(request);
    return {
      ...response,
      sonuclar: response.sonuclar.map((r) => this.toResultDto(r)),
    };
  }

  private toResponse(
    results: ScannerResultDto[],
    durationMs: number,
    scannedCount: number,
  ): ScannerResultsResponseDto {
    const avgAiScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + (r.aiScore ?? 0), 0) / results.length
        : null;
    const avgAiConfidence =
      results.length > 0
        ? results.reduce((sum, r) => sum + (r.aiConfidence ?? 0), 0) / results.length
        : null;
    return {
      baslik: 'Tarama Sonuçları',
      hisseSayisi: results.length,
      toplamTaranan: scannedCount,
      taramaSuresi: durationMs,
      ortalamaYapayZekaPuani: avgAiScore != null ? Math.round(avgAiScore) : null,
      ortalamaYapayZekaGuveni: avgAiConfidence != null ? Math.round(avgAiConfidence) : null,
      sonuclar: results,
    };
  }

  private toResultDto(result: any): ScannerResultDto {
    return {
      ticker: result.ticker,
      company: result.company,
      sector: result.sector,
      price: result.price,
      volume: result.volume,
      marketCap: result.marketCap,
      technicalScore: result.technicalScore,
      fundamentalScore: result.fundamentalScore,
      momentumScore: result.momentumScore,
      trendScore: result.trendScore,
      liquidityScore: result.liquidityScore,
      riskScore: result.riskScore,
      volumeScore: result.volumeScore,
      qualityScore: result.qualityScore,
      verificationScore: result.verificationScore,
      catalystScore: result.catalystScore,
      aiScore: result.aiScore,
      aiConfidence: result.aiConfidence,
      decision: result.decision ?? null,
      opportunity: result.opportunity ?? null,
      entryZone: result.entryZone ?? null,
      analyst: result.analyst ?? null,
      provider: result.provider,
      lastUpdate: result.lastUpdate,
      strategyId: result.strategyId,
      strategyName: result.strategyName,
      strategyScore: result.strategyScore,
      strategyConfidence: result.strategyConfidence,
      passedRules: result.passedRules,
      failedRules: result.failedRules,
      signals: result.signals,
      reasons: result.reasons,
      scannedAt: result.scannedAt,
    };
  }
}