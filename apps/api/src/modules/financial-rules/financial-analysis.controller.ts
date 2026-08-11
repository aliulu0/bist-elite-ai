import {
  Controller,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { FinancialAnalysisService } from './financial-analysis.service';
import { FinancialAnalysisInputDto } from './dto';
import {
  FinancialAnalysisResponseDto,
  FinancialAnalysisErrorDto,
} from './dto';
import { FinancialData } from './rule.types';

@ApiTags('Financial Analysis')
@Controller('financial-analysis')
export class FinancialAnalysisController {
  constructor(private readonly analysisService: FinancialAnalysisService) {}

  @Get(':symbol')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get financial analysis for a symbol' })
  @ApiResponse({ status: 200, description: 'Financial analysis returned', type: FinancialAnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input', type: FinancialAnalysisErrorDto })
  analyze(
    @Param('symbol') symbol: string,
    @Body() input: FinancialAnalysisInputDto,
  ): FinancialAnalysisResponseDto {
    if (!symbol || symbol.trim().length === 0) {
      throw new BadRequestException('Symbol is required');
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    const financialData: FinancialData = {
      symbol: cleanSymbol,
      priceToBook: input.priceToBook ?? null,
      enterpriseValueToEBITDA: input.enterpriseValueToEBITDA ?? null,
      netProfit: input.netProfit ?? null,
      netProfitPrevious: input.netProfitPrevious ?? null,
      equity: input.equity ?? null,
      equityPrevious: input.equityPrevious ?? null,
      totalDebt: input.totalDebt ?? null,
      totalAssets: input.totalAssets ?? null,
      sector: input.sector ?? null,
      sectorAverages: input.sectorAverages
        ? {
            priceToBook: input.sectorAverages.priceToBook ?? undefined,
            enterpriseValueToEBITDA: input.sectorAverages.enterpriseValueToEBITDA ?? undefined,
            debtRatio: input.sectorAverages.debtRatio ?? undefined,
          }
        : undefined,
    };

    const result = this.analysisService.analyze(financialData);

    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
