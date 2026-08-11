import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Public } from '../../../common/auth/decorators';
import { MultiTimeframeOpportunityService } from './multi-timeframe.service';
import { MultiTimeframeOpportunityResult } from './multi-timeframe.types';

@ApiTags('Multi-Timeframe Opportunity')
@Controller('multi-timeframe')
export class MultiTimeframeOpportunityController {
  constructor(private readonly service: MultiTimeframeOpportunityService) {}

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Get multi-timeframe opportunity analysis for a ticker' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol', example: 'THYAO' })
  async analyze(
    @Param('ticker') ticker: string,
    @Query('timeframes') timeframes?: string,
  ): Promise<MultiTimeframeOpportunityResult | null> {
    const timeframeList = timeframes?.split(',').map((t) => t.trim().toUpperCase()) as any;
    return this.service.analyze(ticker, { timeframes: timeframeList });
  }

  @Get(':ticker/explain')
  @Public()
  @ApiOperation({ summary: 'Get deterministic Turkish explanation for multi-timeframe analysis' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol', example: 'THYAO' })
  async explain(@Param('ticker') ticker: string): Promise<{ ticker: string; explanation: string | null }> {
    const result = await this.service.analyze(ticker);
    if (!result) {
      return { ticker: ticker.toUpperCase(), explanation: null };
    }

    const explanation = this.buildExplanation(result);
    return { ticker: ticker.toUpperCase(), explanation };
  }

  private buildExplanation(result: MultiTimeframeOpportunityResult): string {
    const parts: string[] = [];
    
    parts.push(`${result.ticker}: Çok-zamanlı skor ${result.multiTimeframeScore} (${result.strength}).`);
    
    const timeframes = result.timeframesAnalyzed.join(', ');
    parts.push(`Analiz edilen timeframe'ler: ${timeframes}.`);
    
    parts.push(`En iyi timeframe: ${result.bestTimeframe}, En kötü: ${result.worstTimeframe}.`);
    parts.push(`En yükseliş trendli: ${result.mostBullishTimeframe}, En yüksek güven: ${result.highestConfidenceTimeframe}.`);
    
    parts.push(`Trend aşaması: ${result.trendStage}, Beklenen tutma tipi: ${result.holdingType}.`);
    
    if (result.entryZone) {
      parts.push(`Giriş bölgesi: ${result.entryZone.min.toFixed(2)}-${result.entryZone.max.toFixed(2)}, Stop: ${result.stop?.toFixed(2) ?? '-'}, Hedef 1: ${result.target1?.toFixed(2) ?? '-'}, Hedef 2: ${result.target2?.toFixed(2) ?? '-'}.`);
    }
    
    parts.push(`Risk özeti: ${result.riskSummary.summary}.`);
    parts.push(`Beklenen getiri: %${result.expectedReturn.toFixed(1)}.`);
    
    if (result.reasons.length > 0) {
      parts.push(`Sebepler: ${result.reasons.join('; ')}.`);
    }

    return parts.join(' ');
  }
}