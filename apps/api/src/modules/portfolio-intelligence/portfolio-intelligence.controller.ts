import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { PortfolioIntelligenceService } from './portfolio-intelligence.service';
import { AddPositionDto, UpdatePositionDto } from './dto/portfolio-intelligence.dto';

@ApiTags('Portfolio Intelligence')
@Controller('portfolio')
export class PortfolioIntelligenceController {
  constructor(private readonly portfolioIntelligenceService: PortfolioIntelligenceService) {}

  @Get('analysis')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unified portfolio intelligence analysis' })
  async getAnalysis() {
    const data = await this.portfolioIntelligenceService.getAnalysis(true);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('positions')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio positions' })
  async getPositions() {
    const data = this.portfolioIntelligenceService.listPositions();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('opportunities')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio opportunities' })
  async getOpportunities() {
    const data = await this.portfolioIntelligenceService.getOpportunities();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('risk')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio risk metrics' })
  async getRisk() {
    const data = await this.portfolioIntelligenceService.getRisk();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('rebalance')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio rebalancing recommendations' })
  async getRebalance() {
    const data = await this.portfolioIntelligenceService.getRebalance();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('scenarios')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio bull/base/bear scenarios' })
  async getScenarios() {
    const data = await this.portfolioIntelligenceService.getScenarios();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('history')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio analysis snapshot history' })
  async getHistory() {
    const data = await this.portfolioIntelligenceService.getHistory();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('learning')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get portfolio learning / accuracy metrics' })
  async getLearning() {
    const data = await this.portfolioIntelligenceService.getLearning();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('position')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a position to the portfolio' })
  @ApiBody({ type: AddPositionDto })
  async addPosition(@Body() dto: AddPositionDto) {
    const data = this.portfolioIntelligenceService.addPosition(dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('position/:ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a portfolio position' })
  @ApiParam({ name: 'ticker', type: String })
  @ApiBody({ type: UpdatePositionDto })
  async updatePosition(@Param('ticker') ticker: string, @Body() dto: UpdatePositionDto) {
    const data = this.portfolioIntelligenceService.updatePosition(ticker, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('position/:ticker')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a portfolio position' })
  @ApiParam({ name: 'ticker', type: String })
  async removePosition(@Param('ticker') ticker: string) {
    const data = this.portfolioIntelligenceService.removePosition(ticker);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force refresh portfolio analysis (bypasses cache)' })
  async refresh() {
    const data = await this.portfolioIntelligenceService.refresh();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('analyze')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze the portfolio with a fresh computation' })
  async analyze() {
    const data = await this.portfolioIntelligenceService.refresh();
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
