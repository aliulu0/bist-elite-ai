import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { TomorrowService } from './tomorrow.service';
import {
  TomorrowBatchRequestDto,
  TomorrowBatchResponseDto,
  TomorrowCandidateDto,
  TomorrowResponseDto,
  TomorrowTickerParamDto,
} from './tomorrow.dto';

@ApiTags('Yarın Fırsatları')
@Controller('tomorrow')
export class TomorrowController {
  constructor(private readonly service: TomorrowService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tüm yarın fırsatları (Yarın Skoru sıralı)' })
  @ApiResponse({ status: 200, description: 'Yarın fırsatları', type: TomorrowResponseDto })
  getAll(): TomorrowResponseDto {
    const sonuclar = this.service.top(100);
    return {
      baslik: 'Yarın Fırsatları',
      toplamAday: sonuclar.length,
      geceAnalizi: this.service.nightAnalysisWindow(),
      sonuclar,
    };
  }

  @Get('top10')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En güçlü 10 yarın fırsatı' })
  @ApiResponse({ status: 200, description: 'Top 10 yarın fırsatları', type: TomorrowResponseDto })
  top10(): TomorrowResponseDto {
    const sonuclar = this.service.top(10);
    return {
      baslik: 'Top 10 Yarın Fırsatları',
      toplamAday: sonuclar.length,
      geceAnalizi: this.service.nightAnalysisWindow(),
      sonuclar,
    };
  }

  @Get('top20')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En güçlü 20 yarın fırsatı' })
  @ApiResponse({ status: 200, description: 'Top 20 yarın fırsatları', type: TomorrowResponseDto })
  top20(): TomorrowResponseDto {
    const sonuclar = this.service.top(20);
    return {
      baslik: 'Top 20 Yarın Fırsatları',
      toplamAday: sonuclar.length,
      geceAnalizi: this.service.nightAnalysisWindow(),
      sonuclar,
    };
  }

  @Get(':ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirtilen hisse için yarın fırsatı' })
  @ApiParam({ name: 'ticker', description: 'Kod (Ticker)', example: 'THYAO' })
  @ApiResponse({ status: 200, description: 'Yarın fırsatı', type: TomorrowCandidateDto })
  @ApiResponse({ status: 404, description: 'Yarın fırsatı bulunamadı' })
  getByTicker(@Param() params: TomorrowTickerParamDto): TomorrowCandidateDto {
    return this.service.getByTicker(params.ticker);
  }

  @Post('batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toplu yarın fırsatı hesaplama' })
  @ApiResponse({ status: 200, description: 'Yarın fırsatı sonuçları', type: TomorrowBatchResponseDto })
  evaluateBatch(@Body() body: TomorrowBatchRequestDto): TomorrowBatchResponseDto {
    const sonuclar = this.service.evaluateBatch(body.items);
    return { baslik: 'Yarın Fırsatı Hesaplama Sonuçları', islenen: sonuclar.length, sonuclar };
  }
}
