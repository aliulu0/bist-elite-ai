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
import { DecisionEngine } from './decision-engine.service';
import { DecisionRegistry } from './decision-registry.service';
import {
  DecisionBatchRequestDto,
  DecisionBatchResponseDto,
  DecisionResultDto,
  DecisionTickerParamDto,
  DecisionTopResponseDto,
  toDecisionInput,
} from './decision.dto';
import { DecisionInput } from './decision.types';

@ApiTags('Karar')
@Controller('decision')
export class DecisionController {
  constructor(
    private readonly decisionEngine: DecisionEngine,
    private readonly registry: DecisionRegistry,
  ) {}

  @Get('top')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'En güçlü yapay zeka kararları' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum sonuç sayısı', example: 10 })
  @ApiResponse({ status: 200, description: 'En güçlü kararlar', type: DecisionTopResponseDto })
  getTop(@Query('limit') limit?: string): DecisionTopResponseDto {
    const count = limit ? this.clampLimit(Number(limit)) : 10;
    const entries = this.registry.top(count);
    return {
      baslik: 'En Güçlü Yapay Zeka Kararları',
      toplamKarar: entries.length,
      sonuclar: entries.map((entry) => entry.result),
    };
  }

  @Get('all')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tüm kararlar' })
  @ApiResponse({ status: 200, description: 'Tüm kararlar', type: DecisionTopResponseDto })
  getAll(): DecisionTopResponseDto {
    const entries = this.registry.top(this.registry.count() || 10);
    return {
      baslik: 'Yapay Zeka Kararları',
      toplamKarar: entries.length,
      sonuclar: entries.map((entry) => entry.result),
    };
  }

  @Get(':ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirtilen hisse için karar' })
  @ApiParam({ name: 'ticker', description: 'Kod (Ticker)', example: 'THYAO' })
  @ApiResponse({ status: 200, description: 'Karar', type: DecisionResultDto })
  @ApiResponse({ status: 404, description: 'Karar Bulunamadı' })
  getByTicker(@Param() params: DecisionTickerParamDto): DecisionResultDto {
    const entry = this.registry.get(params.ticker);
    if (!entry) {
      throw new NotFoundException(
        `Karar bulunamadı: ${params.ticker}. Önce /decision/batch ile hesaplayın veya bir tarama çalıştırın.`,
      );
    }
    return entry.result;
  }

  @Post('batch')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toplu karar hesaplama' })
  @ApiResponse({ status: 200, description: 'Karar sonuçları', type: DecisionBatchResponseDto })
  evaluateBatch(@Body() body: DecisionBatchRequestDto): DecisionBatchResponseDto {
    const inputs: DecisionInput[] = (body.items ?? []).map((item) =>
      toDecisionInput(item),
    );
    const results = this.decisionEngine.evaluateMany(inputs);
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
    return {
      baslik: 'Karar Hesaplama Sonuçları',
      islenen: results.length,
      sonuclar: results,
    };
  }

  private clampLimit(value: number): number {
    if (Number.isNaN(value)) {
      return 10;
    }
    return Math.max(1, Math.min(100, Math.floor(value)));
  }
}
