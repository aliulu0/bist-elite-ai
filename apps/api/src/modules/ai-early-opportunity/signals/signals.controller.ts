import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/auth/decorators';
import { EarlySignalScannerService } from './early-signal-scanner.service';
import { EarlySignalScannerResultDto } from './signals.dto';

@ApiTags('Early Signal Scanner')
@Controller('signals')
export class SignalsController {
  constructor(private readonly scanner: EarlySignalScannerService) {}

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Top early signals across ALL BIST symbols ranked by signal convergence' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'minSignalStrength', required: false, type: Number, example: 65 })
  @ApiQuery({ name: 'minSignalConvergence', required: false, type: Number, example: 60 })
  @ApiQuery({ name: 'signalCategory', required: false, enum: ['PRICE_VOLUME', 'SMART_MONEY', 'FUNDAMENTAL', 'CATALYST', 'MULTI_TIMEFRAME', 'MARKET_STRUCTURE'] })
  @ApiQuery({ name: 'signalType', required: false, type: String, example: 'accumulation' })
  @ApiQuery({ name: 'earlyOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'confirmedOnly', required: false, type: Boolean })
  async scanTop(
    @Query('limit') limit?: string,
    @Query('minSignalStrength') minSignalStrength?: string,
    @Query('minSignalConvergence') minSignalConvergence?: string,
    @Query('signalCategory') signalCategory?: string,
    @Query('signalType') signalType?: string,
    @Query('earlyOnly') earlyOnly?: string,
    @Query('confirmedOnly') confirmedOnly?: string,
  ): Promise<EarlySignalScannerResultDto[]> {
    const filters = {
      minSignalStrength: minSignalStrength ? Number(minSignalStrength) : undefined,
      minSignalConvergence: minSignalConvergence ? Number(minSignalConvergence) : undefined,
      signalCategory: signalCategory as any,
      signalType: signalType || undefined,
      earlyOnly: earlyOnly === 'true' ? true : undefined,
      confirmedOnly: confirmedOnly === 'true' ? true : undefined,
    };
    const results = await this.scanner.scanTop(limit ? Number(limit) : 10, filters);
    return results.map(EarlySignalScannerResultDto.from);
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({
    summary: 'Deterministic early-signal scan for a single ticker (reuses cached engines)',
  })
  async scan(@Param('ticker') ticker: string): Promise<EarlySignalScannerResultDto | null> {
    const result = await this.scanner.scan(ticker);
    return result ? EarlySignalScannerResultDto.from(result) : null;
  }

  @Get(':ticker/explain')
  @Public()
  @ApiOperation({ summary: 'Deterministic Turkish explanation of detected early signals' })
  async explain(@Param('ticker') ticker: string): Promise<{ ticker: string; explanation: string | null }> {
    const result = await this.scanner.scan(ticker);
    if (!result) return { ticker, explanation: null };
    const parts: string[] = [];
    parts.push(
      `${result.ticker} (${result.company}) için ${result.signals.length} erken sinyal tespit edildi — konsensüs skoru ${result.convergence.convergenceScore}/100.`,
    );
    parts.push(
      `Kapsam: ${result.convergence.categoryCoverage} kategori, ${result.convergence.earlyCount} erken, ${result.convergence.confirmedCount} doğrulanmış sinyal.`,
    );
    for (const s of result.signals) {
      parts.push(
        `[${s.category}] ${s.type} — ${s.description} (${s.strengthLabel}, ${s.phase === 'CONFIRMED' ? 'doğrulandı' : 'erken'}).`,
      );
    }
    if (result.dataQualityStatus === 'DATA_INSUFFICIENT') {
      parts.push('Veri kalitesi yetersiz olduğundan sinyal güçleri sınırlandı.');
    }
    return { ticker, explanation: parts.join(' ') };
  }
}
