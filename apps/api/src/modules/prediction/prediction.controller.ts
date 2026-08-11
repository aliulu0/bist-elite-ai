import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { PredictionService } from './prediction.service';
import { isPredictionTimeframe } from './prediction.utils';
import {
  PredictionDto,
  PredictionRefreshDto,
  PredictionTopDto,
} from './dto/prediction.dto';

@ApiTags('Prediction Engine')
@Controller('prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Get top predictions by bullish probability' })
  async getTop(@Query('limit') limit?: string): Promise<PredictionTopDto> {
    const results = this.predictionService.getTop(limit ? Number(limit) : 10);
    return {
      results: results.map(PredictionDto.from),
      generatedAt: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Force a prediction refresh for a ticker' })
  async refresh(
    @Query('ticker') ticker: string,
    @Query('timeframe') timeframe?: string,
  ): Promise<PredictionRefreshDto> {
    const tf = this.resolveTimeframe(timeframe);
    const result = await this.predictionService.refreshPrediction(ticker, tf);
    return { ticker: result.ticker, result: PredictionDto.from(result) };
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Get multi-timeframe prediction for a ticker' })
  async getPrediction(
    @Param('ticker') ticker: string,
    @Query('timeframe') timeframe?: string,
  ): Promise<PredictionDto> {
    const tf = this.resolveTimeframe(timeframe);
    const result = await this.predictionService.getPrediction(ticker, tf);
    return PredictionDto.from(result);
  }

  private resolveTimeframe(timeframe?: string) {
    if (timeframe && isPredictionTimeframe(timeframe)) return timeframe;
    return '1d' as const;
  }
}
