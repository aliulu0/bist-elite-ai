import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Body } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { PortfolioOptimizationService } from './portfolio-optimization.service';
import {
  PortfolioOptimizationTickerDto,
  PortfolioOptimizationResponseDto,
} from './portfolio-optimization.dto';

@ApiTags('Portföy Optimizasyon')
@Controller('portfolio')
export class PortfolioOptimizationController {
  constructor(private readonly service: PortfolioOptimizationService) {}

  @Get('optimize/:ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirtilen hisse için portföy optimizasyonu' })
  @ApiParam({ name: 'ticker', description: 'Kod (Ticker)', example: 'THYAO' })
  @ApiResponse({ status: 200, description: 'Portföy optimizasyonu sonucu', type: PortfolioOptimizationResponseDto })
  @ApiResponse({ status: 404, description: 'Optimizasyon hesaplanamadı' })
  async getByTicker(@Param() params: PortfolioOptimizationTickerDto): Promise<PortfolioOptimizationResponseDto> {
    const result = await this.service.getByTicker(params.ticker);
    return {
      baslik: `Portföy Optimizasyonu - ${params.ticker}`,
      sonuc: result as any,
      tahminZamani: result.evaluatedAt,
    };
  }

  @Get('top')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En yüksek portföy skorları' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 10 })
  @ApiResponse({ status: 200, description: 'Portföy optimizasyon sonuçları', type: PortfolioOptimizationResponseDto })
  async top(@Query('limit') limit?: string): Promise<PortfolioOptimizationResponseDto> {
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 10;
    const results = await this.service.top(limitNum);
    return {
      baslik: 'Portföy Optimizasyon Sonuçları',
      sonuc: results[0] as any,
      tahminZamani: new Date().toISOString(),
    };
  }

  @Post('optimize')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Portföy optimizasyonu hesaplama' })
  @ApiResponse({ status: 200, description: 'Portföy optimizasyonu sonucu', type: PortfolioOptimizationResponseDto })
  async optimize(@Body() body: PortfolioOptimizationTickerDto): Promise<PortfolioOptimizationResponseDto> {
    const result = await this.service.getByTicker(body.ticker);
    return {
      baslik: `Portföy Optimizasyonu - ${body.ticker}`,
      sonuc: result as any,
      tahminZamani: result.evaluatedAt,
    };
  }
}