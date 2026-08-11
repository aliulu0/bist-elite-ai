import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { VerificationAIService } from './verification-ai.service';
import {
  VerificationReportDto,
  VerificationResultDto,
  VerificationRefreshDto,
} from './dto/verification-ai.dto';

@ApiTags('Verification AI')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationAI: VerificationAIService) {}

  @Get('report/:ticker')
  @Public()
  @ApiOperation({ summary: 'Get verification report for a ticker' })
  async getReport(@Param('ticker') ticker: string): Promise<VerificationReportDto> {
    const report = await this.verificationAI.getReport(ticker);
    return VerificationReportDto.from(report);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Force a verification refresh for a ticker' })
  async refresh(@Query('ticker') ticker: string): Promise<VerificationRefreshDto> {
    const result = await this.verificationAI.refreshVerification(ticker);
    return { ticker: result.ticker, result: VerificationResultDto.from(result) };
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Get verification for a ticker' })
  async getVerification(@Param('ticker') ticker: string): Promise<VerificationResultDto> {
    const result = await this.verificationAI.getVerification(ticker);
    return VerificationResultDto.from(result);
  }
}
