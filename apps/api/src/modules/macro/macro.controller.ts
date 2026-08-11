import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { MacroService } from './macro.service';
import { CentralBank } from './macro.types';
import { MacroConfidenceQueryDto } from './dto/macro-elite.dto';
import { MacroEliteResult, MacroRecommendation, MacroTrendResult, CombinedConfidenceResult } from './macro-elite.types';
import { MacroDashboardBundleDto } from './dto/macro-dashboard.dto';

@ApiTags('macro')
@Controller('macro')
export class MacroController {
  constructor(private readonly macroService: MacroService) {}

  @Get()
  @ApiOperation({ summary: 'Get full macro analysis snapshot (data, TCMB/FED/ECB, regime, score, sectors)' })
  async getFullAnalysis() {
    return this.macroService.getFullAnalysis();
  }

  @Get('data')
  @ApiOperation({ summary: 'Get raw macro data snapshot from the Market Data layer' })
  async getData() {
    return this.macroService.getData();
  }

  @Get('score')
  @ApiOperation({ summary: 'Get macro score result' })
  async getMacroScore() {
    return this.macroService.getMacroScore();
  }

  @Get('regime')
  @ApiOperation({ summary: 'Get market regime analysis' })
  async getRegime() {
    return this.macroService.getRegime();
  }

  @Get('central-bank/:bank')
  @ApiOperation({ summary: 'Get central bank analysis (tcmb, fed, ecb)' })
  @ApiParam({ name: 'bank', enum: ['tcmb', 'fed', 'ecb'] })
  async getCentralBankAnalysis(@Param('bank') bank: CentralBank) {
    return this.macroService.getCentralBankAnalysis(bank);
  }

  @Get('combined-confidence')
  @ApiOperation({ summary: 'Get legacy combined confidence from elite score and macro score' })
  @ApiQuery({ name: 'eliteScore', type: Number, required: true })
  async getCombinedConfidence(@Query('eliteScore', ParseIntPipe) eliteScore: number) {
    return this.macroService.getCombinedConfidence(eliteScore);
  }

  @Get('elite-score')
  @ApiOperation({ summary: 'Get Macro Elite Score (0-100) with confidence, trend, risk and recommendation' })
  @ApiOkResponse({ type: Object })
  async getMacroEliteScore(): Promise<MacroEliteResult> {
    return this.macroService.getMacroEliteScore();
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get macro trend derived from elite score movement and recent TCMB decisions' })
  @ApiOkResponse({ type: Object })
  async getMacroTrend(): Promise<MacroTrendResult> {
    return this.macroService.getMacroTrend();
  }

  @Get('confidence')
  @ApiOperation({ summary: 'Get combined confidence (confidence only, no score merge) from elite and macro confidence' })
  @ApiQuery({ name: 'eliteConfidence', type: Number, required: false, description: 'Elite confidence 0-100 (default 70)' })
  async getCombinedMacroConfidence(
    @Query() query: MacroConfidenceQueryDto,
  ): Promise<CombinedConfidenceResult> {
    return this.macroService.getCombinedMacroConfidence(query.eliteConfidence);
  }

  @Get('recommendation')
  @ApiOperation({ summary: 'Get macro portfolio recommendation (opportunistic/selective/defensive/cash)' })
  @ApiOkResponse({ type: Object })
  async getMacroRecommendation(): Promise<MacroRecommendation> {
    return this.macroService.getMacroRecommendation();
  }

  @Get('decision-history')
  @ApiOperation({ summary: 'Get stored TCMB decision history with analyses' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Number of decisions to return (default 20)' })
  async getDecisionHistory(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 20;
    return this.macroService.getDecisionHistory(parsed);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get full macro dashboard bundle for the UI' })
  @ApiOkResponse({ type: MacroDashboardBundleDto })
  async getDashboard(): Promise<MacroDashboardBundleDto> {
    return this.macroService.getDashboard();
  }

  @Get('sectors')
  @ApiOperation({ summary: 'Get sector impact estimates' })
  async getSectorImpacts() {
    return this.macroService.getSectorImpacts();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get macro alert events' })
  async getAlerts() {
    return this.macroService.getAlerts();
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Get macro-driven opportunities for a given elite score threshold' })
  @ApiQuery({ name: 'eliteScore', type: Number, required: false })
  async getOpportunities(@Query('eliteScore') eliteScore?: string) {
    const score = eliteScore ? parseInt(eliteScore, 10) : 75;
    return this.macroService.getOpportunities(score);
  }

  @Get('risk')
  @ApiOperation({ summary: 'Get macro risk items' })
  async getRisk() {
    return this.macroService.getRisk();
  }
}
