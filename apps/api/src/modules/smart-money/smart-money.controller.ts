import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { SmartMoneyService } from './smart-money.service';
import {
  SmartMoneyRefreshDto,
  SmartMoneyScoreDto,
  SmartMoneyTopDto,
} from './dto/smart-money.dto';

@ApiTags('Smart Money Engine')
@Controller('smart-money')
export class SmartMoneyController {
  constructor(private readonly smartMoneyService: SmartMoneyService) {}

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Get top smart money results' })
  async getTop(@Query('limit') limit?: string): Promise<SmartMoneyTopDto> {
    const results = this.smartMoneyService.getTop(limit ? Number(limit) : 10);
    return {
      results: results.map(SmartMoneyScoreDto.from),
      generatedAt: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Force a smart money refresh for a ticker' })
  async refresh(@Query('ticker') ticker: string): Promise<SmartMoneyRefreshDto> {
    const result = await this.smartMoneyService.refreshSmartMoney(ticker);
    return { ticker: result.ticker, result: SmartMoneyScoreDto.from(result) };
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Get smart money detection for a ticker' })
  async getSmartMoney(@Param('ticker') ticker: string): Promise<SmartMoneyScoreDto> {
    const result = await this.smartMoneyService.getSmartMoney(ticker);
    return SmartMoneyScoreDto.from(result);
  }
}
