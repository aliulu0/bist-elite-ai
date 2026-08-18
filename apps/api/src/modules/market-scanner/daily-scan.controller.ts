import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { Public } from '../../common/auth/decorators';
import { DailyMarketScanService } from './daily-market-scan.service';
import { DailyScanRunOptions } from './daily-scan.types';

// R2-078: Daily scan manual trigger + snapshot/radar/summary reads.
class DailyScanRunDto implements DailyScanRunOptions {
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;

  @IsOptional()
  @IsNumber()
  maxSymbols?: number;
}

@ApiTags('MarketScanner-DailyScan')
@Controller('market-scanner/daily-scan')
export class DailyScanController {
  constructor(private readonly dailyScan: DailyMarketScanService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tam BIST günlük taramayı tetikler (sembol bazlı hata taramayı durdurmaz)',
  })
  async run(@Body() body: DailyScanRunDto) {
    return this.dailyScan.runDailyScan({
      forceRefresh: body.forceRefresh,
      maxSymbols: body.maxSymbols,
    });
  }

  @Get('latest')
  @Public()
  @ApiOperation({ summary: 'En son günlük tarama anlık görüntüsü (snapshot)' })
  getLatest() {
    const snapshot = this.dailyScan.getLatestSnapshot();
    if (!snapshot) {
      throw new NotFoundException('Henüz günlük tarama yapılmadı (snapshot yok)');
    }
    return snapshot;
  }

  @Get('radar')
  @Public()
  @ApiOperation({ summary: 'En son taramada tespit edilen fırsat radarı olayları' })
  getRadar() {
    const events = this.dailyScan.getLatestRadarEvents();
    const snapshot = this.dailyScan.getLatestSnapshot();
    return {
      scanId: snapshot?.scanId ?? null,
      scanTimestamp: snapshot?.scanTimestamp ?? null,
      eventCount: events.length,
      events,
    };
  }

  @Get('summary')
  @Public()
  @ApiOperation({ summary: 'En son tarama özeti (TOP10/20/50 + olay özetleri)' })
  getSummary() {
    const summary = this.dailyScan.getScanSummary();
    if (!summary) {
      throw new NotFoundException('Henüz günlük tarama yapılmadı (özet yok)');
    }
    return summary;
  }
}
