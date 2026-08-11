import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { PortfolioEngine } from './engine/portfolio-engine.service';
import { CreatePortfolioDto, ExecuteTransactionDto, PerformanceQueryDto } from './dto/portfolio.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioEngine: PortfolioEngine) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all portfolios' })
  listPortfolios() {
    return {
      success: true,
      data: this.portfolioEngine.getPortfolios(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio observability metrics' })
  getMetrics() {
    return {
      success: true,
      data: this.portfolioEngine.getObservabilityMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a portfolio by id' })
  @ApiParam({ name: 'id', type: String })
  getPortfolio(@Param('id') id: string) {
    const portfolio = this.portfolioEngine.getPortfolio(id);
    if (!portfolio) {
      throw new NotFoundException(`Portfolio not found: ${id}`);
    }
    return { success: true, data: portfolio, timestamp: new Date().toISOString() };
  }

  @Get(':id/summary')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio summary' })
  @ApiParam({ name: 'id', type: String })
  getSummary(@Param('id') id: string) {
    const summary = this.portfolioEngine.getSummary(id);
    if (!summary) {
      throw new NotFoundException(`Portfolio not found: ${id}`);
    }
    return { success: true, data: summary, timestamp: new Date().toISOString() };
  }

  @Get(':id/positions')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio positions' })
  @ApiParam({ name: 'id', type: String })
  getPositions(@Param('id') id: string) {
    return {
      success: true,
      data: this.portfolioEngine.getPositions(id),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/transactions')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio transaction history' })
  @ApiParam({ name: 'id', type: String })
  getTransactions(@Param('id') id: string) {
    return {
      success: true,
      data: this.portfolioEngine.getTransactionHistory(id),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/risk')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio risk metrics' })
  @ApiParam({ name: 'id', type: String })
  getRisk(@Param('id') id: string) {
    const risk = this.portfolioEngine.getRisk(id);
    if (!risk) {
      throw new NotFoundException(`Portfolio not found: ${id}`);
    }
    return { success: true, data: risk, timestamp: new Date().toISOString() };
  }

  @Get(':id/allocation')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio allocation breakdown' })
  @ApiParam({ name: 'id', type: String })
  getAllocation(@Param('id') id: string) {
    return {
      success: true,
      data: this.portfolioEngine.getAllocation(id),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/performance')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio performance report' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'period', required: false, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'SINCE_INCEPTION'] })
  getPerformance(@Param('id') id: string, @Query() query: PerformanceQueryDto) {
    const report = this.portfolioEngine.getPerformance(id, query.period ?? 'MONTHLY');
    if (!report) {
      throw new NotFoundException(`Portfolio not found: ${id}`);
    }
    return { success: true, data: report, timestamp: new Date().toISOString() };
  }

  @Get(':id/report')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full portfolio report' })
  @ApiParam({ name: 'id', type: String })
  getReport(@Param('id') id: string) {
    const report = this.portfolioEngine.getFullReport(id);
    if (!report) {
      throw new NotFoundException(`Portfolio not found: ${id}`);
    }
    return { success: true, data: report, timestamp: new Date().toISOString() };
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a portfolio' })
  createPortfolio(@Body() dto: CreatePortfolioDto) {
    const portfolio = this.portfolioEngine.createPortfolio(dto);
    return { success: true, data: portfolio, timestamp: new Date().toISOString() };
  }

  @Post(':id/transactions')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Execute a transaction on a portfolio' })
  @ApiParam({ name: 'id', type: String })
  executeTransaction(@Param('id') id: string, @Body() dto: ExecuteTransactionDto) {
    const result = this.portfolioEngine.executeTransaction(id, dto);
    return { success: true, data: result, timestamp: new Date().toISOString() };
  }
}
