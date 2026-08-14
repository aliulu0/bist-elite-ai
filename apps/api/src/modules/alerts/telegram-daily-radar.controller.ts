import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TelegramDailyRadarService, TelegramRadarRunResult, TelegramPreviewResult, TelegramStatusResult } from './telegram-daily-radar.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TelegramDeliveryRecord } from './telegram-delivery.repository';

/**
 * R2-051 — Telegram Daily Opportunity Radar HTTP surface.
 *
 * All endpoints are read/trigger-only. They never expose the bot token, chat
 * secrets or authorization headers.
 */
@Controller('telegram')
@ApiTags('telegram')
export class TelegramDailyRadarController {
  constructor(private readonly radarService: TelegramDailyRadarService) {}

  @Get('status')
  @ApiOperation({ summary: 'Telegram daily radar durum bilgisi (secrets içermez)' })
  @ApiResponse({ status: 200, description: 'Telegram radar durumu' })
  getStatus(): Promise<TelegramStatusResult> {
    return this.radarService.getStatus();
  }

  @Get('preview')
  @ApiOperation({ summary: 'Gönderilecek Türkçe radar mesajının önizlemesi' })
  @ApiResponse({ status: 200, description: 'Telegram radar önizlemesi' })
  getPreview(): Promise<TelegramPreviewResult> {
    return this.radarService.getPreview();
  }

  @Post('radar/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram günlük radarı manuel tetikler' })
  @ApiQuery({ name: 'forceRefresh', required: false, description: 'Yeni radar taraması zorla' })
  @ApiQuery({ name: 'dryRun', required: false, description: 'Göndermeden sadece önizleme (üretim mesajını oluşturur)' })
  @ApiResponse({ status: 200, description: 'Gönderim sonucu' })
  async sendNow(
    @Query('forceRefresh') forceRefresh?: string,
    @Query('dryRun') dryRun?: string,
  ): Promise<TelegramRadarRunResult> {
    const wasDryRun = this.radarService.getConfig().dryRun;
    if (dryRun !== undefined) {
      // A dry-run override is applied by temporarily toggling the config. The
      // service snapshots config at construction; for an explicit query override
      // we rebuild the run with a dry-run client wrapper instead of mutating.
      this.radarService.forceDryRun(dryRun !== 'false');
    }
    try {
      return await this.radarService.sendNow({ forceRefresh: forceRefresh === 'true' });
    } finally {
      if (dryRun !== undefined) {
        this.radarService.forceDryRun(wasDryRun);
      }
    }
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Teslimat geçmişi (kişisel kullanım)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum kayıt sayısı' })
  @ApiQuery({ name: 'status', required: false, description: 'Durum filtresi' })
  @ApiQuery({ name: 'ticker', required: false, description: 'Sembol filtresi' })
  @ApiResponse({ status: 200, description: 'Telegram teslimat geçmişi' })
  async getDeliveries(
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('ticker') ticker?: string,
  ): Promise<{ deliveries: TelegramDeliveryRecord[]; total: number }> {
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500) : 50;
    return this.radarService.listDeliveries(parsedLimit, status, ticker);
  }
}
