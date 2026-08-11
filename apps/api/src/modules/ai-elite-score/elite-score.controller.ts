import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { EliteScoreService } from './elite-score.service';
import {
  EliteScoreBatchRequestDto,
  EliteScoreBatchResponseDto,
  EliteScoreListResponseDto,
  EliteScoreResultDto,
  EliteScoreTickerParamDto,
} from './elite-score.dto';
import { EliteScoreHorizon } from './elite-score.types';

@ApiTags('Elite Skor')
@Controller('elite-score')
export class EliteScoreController {
  constructor(private readonly service: EliteScoreService) {}

  @Get('top')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En yüksek Elite skorlar (Günlük bazında sıralı)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 100 })
  @ApiResponse({ status: 200, description: 'Elite skorlar', type: EliteScoreListResponseDto })
  top(@Query('limit') limit?: string): EliteScoreListResponseDto {
    const results = this.service.top(this.clampLimit(limit));
    return { baslik: 'Elite Skor Sıralaması', toplam: results.length, sonuclar: results };
  }

  @Get('daily')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Günlük Elite skor sıralaması' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 100 })
  @ApiResponse({ status: 200, description: 'Günlük Elite skorlar', type: EliteScoreListResponseDto })
  daily(@Query('limit') limit?: string): EliteScoreListResponseDto {
    const results = this.service.rankedByHorizon('GUNLUK', this.clampLimit(limit));
    return { baslik: 'Günlük Elite Skorlar', toplam: results.length, sonuclar: results };
  }

  @Get('weekly')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Haftalık Elite skor sıralaması' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 100 })
  @ApiResponse({ status: 200, description: 'Haftalık Elite skorlar', type: EliteScoreListResponseDto })
  weekly(@Query('limit') limit?: string): EliteScoreListResponseDto {
    const results = this.service.rankedByHorizon('HAFTALIK', this.clampLimit(limit));
    return { baslik: 'Haftalık Elite Skorlar', toplam: results.length, sonuclar: results };
  }

  @Get('monthly')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aylık Elite skor sıralaması' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 100 })
  @ApiResponse({ status: 200, description: 'Aylık Elite skorlar', type: EliteScoreListResponseDto })
  monthly(@Query('limit') limit?: string): EliteScoreListResponseDto {
    const results = this.service.rankedByHorizon('AYLIK', this.clampLimit(limit));
    return { baslik: 'Aylık Elite Skorlar', toplam: results.length, sonuclar: results };
  }

  @Get('3m')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '3 Aylık Elite skor sıralaması' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 100 })
  @ApiResponse({ status: 200, description: '3 Aylık Elite skorlar', type: EliteScoreListResponseDto })
  threeMonth(@Query('limit') limit?: string): EliteScoreListResponseDto {
    const results = this.service.rankedByHorizon('UC_AYLIK', this.clampLimit(limit));
    return { baslik: '3 Aylık Elite Skorlar', toplam: results.length, sonuclar: results };
  }

  @Get('6m')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '6 Aylık Elite skor sıralaması' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 100 })
  @ApiResponse({ status: 200, description: '6 Aylık Elite skorlar', type: EliteScoreListResponseDto })
  sixMonth(@Query('limit') limit?: string): EliteScoreListResponseDto {
    const results = this.service.rankedByHorizon('ALTI_AYLIK', this.clampLimit(limit));
    return { baslik: '6 Aylık Elite Skorlar', toplam: results.length, sonuclar: results };
  }

  @Get(':ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirtilen hisse için Elite skorlar' })
  @ApiParam({ name: 'ticker', description: 'Kod (Ticker)', example: 'THYAO' })
  @ApiResponse({ status: 200, description: 'Elite skor', type: EliteScoreResultDto })
  @ApiResponse({ status: 404, description: 'Elite skor bulunamadı' })
  getByTicker(@Param() params: EliteScoreTickerParamDto): EliteScoreResultDto {
    return this.service.getByTicker(params.ticker);
  }

  @Post('batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toplu Elite skor hesaplama' })
  @ApiResponse({ status: 200, description: 'Elite skor sonuçları', type: EliteScoreBatchResponseDto })
  evaluateBatch(@Body() body: EliteScoreBatchRequestDto): EliteScoreBatchResponseDto {
    const results = this.service.evaluateBatch(body.items);
    return { baslik: 'Elite Skor Hesaplama Sonuçları', islenen: results.length, sonuclar: results };
  }

  private clampLimit(limit?: string): number {
    if (limit == null) {
      return 100;
    }
    const value = Number(limit);
    if (Number.isNaN(value)) {
      return 100;
    }
    return Math.max(1, Math.min(795, Math.floor(value)));
  }
}
