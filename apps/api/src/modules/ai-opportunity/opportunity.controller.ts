import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { toDecisionInput } from '../decision/decision.dto';
import { OpportunityEngine } from './opportunity-engine.service';
import { OpportunityRegistry } from './opportunity-registry.service';
import { OpportunityRankingService } from './opportunity-ranking.service';
import {
  OpportunityBatchRequestDto,
  OpportunityResponseDto,
  OpportunityResultDto,
  OpportunityTickerParamDto,
} from './opportunity.dto';
import { OpportunityInput } from './opportunity.types';

@ApiTags('Fırsat')
@Controller('opportunity')
export class OpportunityController {
  constructor(
    private readonly opportunityEngine: OpportunityEngine,
    private readonly registry: OpportunityRegistry,
    private readonly ranking: OpportunityRankingService,
  ) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tüm fırsatlar (sıralı)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 100 })
  @ApiResponse({ status: 200, description: 'Fırsat listesi', type: OpportunityResponseDto })
  getAll(@Query('limit') limit?: string): OpportunityResponseDto {
    const count = this.clampLimit(limit);
    const entries = this.registry.top(count);
    return {
      baslik: 'AI Fırsatlar',
      toplamFirsat: entries.length,
      sonuclar: entries.map((e) => e.result),
    };
  }

  @Get('top')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En güçlü fırsatlar' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 10 })
  @ApiResponse({ status: 200, description: 'En güçlü fırsatlar', type: OpportunityResponseDto })
  getTop(@Query('limit') limit?: string): OpportunityResponseDto {
    const count = this.clampLimit(limit);
    const entries = this.registry.top(count);
    return {
      baslik: 'En Güçlü AI Fırsatları',
      toplamFirsat: entries.length,
      sonuclar: entries.map((e) => e.result),
    };
  }

  @Get(':ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirtilen hisse için fırsat' })
  @ApiParam({ name: 'ticker', description: 'Kod (Ticker)', example: 'THYAO' })
  @ApiResponse({ status: 200, description: 'Fırsat', type: OpportunityResultDto })
  @ApiResponse({ status: 404, description: 'Fırsat Bulunamadı' })
  getByTicker(@Param() params: OpportunityTickerParamDto): OpportunityResultDto {
    const entry = this.registry.get(params.ticker);
    if (!entry) {
      throw new NotFoundException(
        `Fırsat bulunamadı: ${params.ticker}. Önce /opportunity/batch ile hesaplayın veya bir tarama çalıştırın.`,
      );
    }
    return entry.result;
  }

  @Post('batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toplu fırsat hesaplama' })
  @ApiResponse({ status: 200, description: 'Fırsat sonuçları', type: OpportunityResponseDto })
  evaluateBatch(@Body() body: OpportunityBatchRequestDto): OpportunityResponseDto {
    const inputs: OpportunityInput[] = (body.items ?? []).map((item) =>
      toDecisionInput(item),
    );
    const results = this.opportunityEngine.evaluateMany(inputs);
    for (const result of results) {
      const input = inputs.find((i) => i.ticker === result.ticker);
      if (input) {
        this.registry.set({
          ticker: result.ticker,
          input,
          result,
          evaluatedAt: result.evaluatedAt,
        });
      }
    }
    const ranked = this.ranking.rank(results);
    return {
      baslik: 'Fırsat Hesaplama Sonuçları',
      toplamFirsat: ranked.length,
      sonuclar: ranked,
    };
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
