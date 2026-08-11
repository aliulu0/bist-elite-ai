import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { CatalystService } from './catalyst.service';
import {
  CatalystRefreshDto,
  CatalystResultDto,
  CatalystTopDto,
} from './dto/catalyst.dto';

@ApiTags('Catalyst Engine')
@Controller('catalyst')
export class CatalystController {
  constructor(private readonly catalystService: CatalystService) {}

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Get top catalyst results' })
  async getTop(@Query('limit') limit?: string): Promise<CatalystTopDto> {
    const results = this.catalystService.getTop(limit ? Number(limit) : 10);
    return {
      results: results.map(CatalystResultDto.from),
      generatedAt: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Force a catalyst refresh for a ticker' })
  async refresh(@Query('ticker') ticker: string): Promise<CatalystRefreshDto> {
    const result = await this.catalystService.refreshCatalyst(ticker);
    return { ticker: result.ticker, result: CatalystResultDto.from(result) };
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Get catalyst detection for a ticker' })
  async getCatalyst(@Param('ticker') ticker: string): Promise<CatalystResultDto> {
    const result = await this.catalystService.getCatalyst(ticker);
    return CatalystResultDto.from(result);
  }
}
