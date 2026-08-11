import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { AnalystService } from './analyst.service';
import {
  AnalystBatchRequestDto,
  AnalystBatchResponseDto,
  AnalystListResponseDto,
  AnalystTickerParamDto,
  AnalystTopQueryDto,
  AnalystResultDto,
} from './analyst.dto';

@ApiTags('AI Analiz')
@Controller('analysis')
export class AnalystController {
  constructor(private readonly service: AnalystService) {}

  @Get('top')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En güçlü AI analiz sonuçları' })
  @ApiResponse({ status: 200, description: 'AI analiz sonuçları', type: AnalystListResponseDto })
  async top(@Query() query: AnalystTopQueryDto): Promise<AnalystListResponseDto> {
    const sonuclar = await this.service.top(query.limit ?? 10);
    return { baslik: 'AI Analiz Sonuçları', toplam: sonuclar.length, sonuclar };
  }

  @Get('batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Önbellekteki tüm AI analiz sonuçları' })
  @ApiResponse({ status: 200, description: 'AI analiz sonuçları', type: AnalystListResponseDto })
  batch(): AnalystListResponseDto {
    const sonuclar = this.service.allCached();
    return { baslik: 'AI Analiz Sonuçları', toplam: sonuclar.length, sonuclar };
  }

  @Get(':ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirtilen hisse için AI analizi' })
  @ApiParam({ name: 'ticker', description: 'Kod (Ticker)', example: 'THYAO' })
  @ApiResponse({ status: 200, description: 'AI analizi', type: AnalystResultDto })
  @ApiResponse({ status: 404, description: 'Analiz hesaplanamadı' })
  async getByTicker(@Param() params: AnalystTickerParamDto): Promise<AnalystResultDto> {
    return this.service.getByTicker(params.ticker);
  }

  @Post('batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toplu AI analizi hesaplama' })
  @ApiResponse({ status: 200, description: 'AI analizi sonuçları', type: AnalystBatchResponseDto })
  async calculate(@Body() body: AnalystBatchRequestDto): Promise<AnalystBatchResponseDto> {
    const sonuclar = await this.service.evaluateBatch(body.items);
    return { baslik: 'AI Analiz Hesaplama Sonuçları', islenen: sonuclar.length, sonuclar };
  }
}