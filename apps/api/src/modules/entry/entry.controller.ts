import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { EntryService } from './entry.service';
import {
  EntryBatchRequestDto,
  EntryBatchResponseDto,
  EntryCalculateRequestDto,
  EntryListResponseDto,
  EntryTickerParamDto,
  EntryTopQueryDto,
  EntryZoneResultDto,
} from './entry.dto';

@ApiTags('Giriş Bölgesi')
@Controller('entry')
export class EntryController {
  constructor(private readonly service: EntryService) {}

  @Get('top')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En güçlü giriş bölgeleri (giriş güveni sıralı)' })
  @ApiResponse({ status: 200, description: 'Top giriş bölgeleri', type: EntryListResponseDto })
  async top(@Query() query: EntryTopQueryDto): Promise<EntryListResponseDto> {
    const sonuclar = await this.service.top(query.limit ?? 10);
    return { baslik: 'En Güçlü Giriş Bölgeleri', toplam: sonuclar.length, sonuclar };
  }

  @Get('batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Önbellekteki tüm giriş bölgeleri' })
  @ApiResponse({ status: 200, description: 'Giriş bölgeleri', type: EntryListResponseDto })
  batch(): EntryListResponseDto {
    const sonuclar = this.service.allCached();
    return { baslik: 'Giriş Bölgeleri', toplam: sonuclar.length, sonuclar };
  }

  @Get(':ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirtilen hisse için giriş bölgesi' })
  @ApiParam({ name: 'ticker', description: 'Kod (Ticker)', example: 'THYAO' })
  @ApiResponse({ status: 200, description: 'Giriş bölgesi', type: EntryZoneResultDto })
  @ApiResponse({ status: 404, description: 'Giriş bölgesi hesaplanamadı' })
  async getByTicker(@Param() params: EntryTickerParamDto): Promise<EntryZoneResultDto> {
    return this.service.getByTicker(params.ticker);
  }

  @Post('calculate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toplu giriş bölgesi hesaplama' })
  @ApiResponse({ status: 200, description: 'Giriş bölgesi sonuçları', type: EntryBatchResponseDto })
  async calculate(@Body() body: EntryCalculateRequestDto): Promise<EntryBatchResponseDto> {
    const sonuclar = await this.service.evaluateBatch(body.items);
    return { baslik: 'Giriş Bölgesi Hesaplama Sonuçları', islenen: sonuclar.length, sonuclar };
  }
}
