import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Public } from '../../../common/auth/decorators';
import { RadarService, RadarTopQuery } from './radar.service';
import { RadarRunOptions } from './radar.types';

// R2-049: DTOs for persistence/learning endpoints
class RadarRunDto implements RadarRunOptions {
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  watchlist?: string[];

  @IsOptional()
  @IsNumber()
  maxSymbols?: number;

  @IsOptional()
  @IsNumber()
  minScore?: number;
}

class FeedbackDto {
  constructor(userAction: 'CONFIRM' | 'REJECT' | 'IGNORE', explanation: string, userId?: string) {
    this.userAction = userAction;
    this.explanation = explanation;
    this.userId = userId;
  }
  userAction: 'CONFIRM' | 'REJECT' | 'IGNORE';
  explanation: string;
  userId?: string;
}

class ActivateLearnedConfigDto {
  constructor(version: string) {
    this.version = version;
  }
  version: string;
}

class ResetLearnedStateDto {
  constructor(toVersion?: string) {
    this.toVersion = toVersion;
  }
  toVersion?: string;
}

@ApiTags('Radar')
@Controller('radar')
export class RadarController {
  constructor(private readonly radar: RadarService) {}

  @Post('run')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Radar taramasını tetikler (cache-friendly, tekrarlı çağrıya güvenli)' })
  async run(@Body() body: RadarRunDto) {
    const snapshot = await this.radar.runRadar({
      forceRefresh: body.forceRefresh,
      sector: body.sector,
      watchlist: body.watchlist,
      maxSymbols: body.maxSymbols,
      minScore: body.minScore,
    });
    return {
      success: true,
      timestamp: snapshot.timestamp,
      marketSession: snapshot.marketSession,
      marketSessionLabel: snapshot.marketSessionLabel,
      freshnessNote: snapshot.freshnessNote,
      symbolsEvaluated: snapshot.symbolsEvaluated,
      activeOpportunities: snapshot.activeOpportunities,
      newOpportunities: snapshot.newOpportunities,
      strengtheningOpportunities: snapshot.strengtheningOpportunities,
      weakeningOpportunities: snapshot.weakeningOpportunities,
      invalidatedOpportunities: snapshot.invalidatedOpportunities,
      confirmedOpportunities: snapshot.confirmedOpportunities,
      providerCallStats: snapshot.providerCallStats,
      dataQualitySummary: snapshot.dataQualitySummary,
      executionDurationMs: snapshot.executionDurationMs,
    };
  }

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'En yüksek önceliteli radar fırsatları' })
  getTop(
    @Query('limit') limit?: string,
    @Query('minScore') minScore?: string,
    @Query('state') state?: string,
    @Query('sector') sector?: string,
    @Query('minDataQuality') minDataQuality?: string,
    @Query('signalStrength') signalStrength?: string,
    @Query('confidence') confidence?: string,
    @Query('risk') risk?: string,
    @Query('expectedReturn') expectedReturn?: string,
    @Query('timeframe') timeframe?: string,
  ) {
    const query: RadarTopQuery = {
      limit: limit ? Number(limit) : undefined,
      minScore: minScore ? Number(minScore) : undefined,
      state: state as RadarTopQuery['state'],
      sector,
      minDataQuality: minDataQuality ? Number(minDataQuality) : undefined,
      signalStrength: signalStrength ? Number(signalStrength) : undefined,
      confidence: confidence ? Number(confidence) : undefined,
      risk,
      expectedReturn: expectedReturn ? Number(expectedReturn) : undefined,
      timeframe,
    };
    return this.radar.getTop(query);
  }

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Radar çalışma durumu' })
  getStatus() {
    return {
      ...this.radar.getStatus(),
      hasSnapshot: this.radar.hasSnapshot(),
      events: this.radar.getEvents(20),
    };
  }

  // R2-049: Get all learned weight configurations
  // Declared before `:ticker` so the static segment is never captured as a ticker.
  @Get('learned-configs')
  @Public()
  @ApiOperation({ summary: 'Tüm öğrenilen ağırlık konfigurasyonlarını listele' })
  getLearnedConfigs() {
    return this.radar.getLearnedConfigs();
  }

  @Get(':ticker/explain')
  @Public()
  @ApiOperation({ summary: 'Belirli sembol için Türkçe radar açıklaması' })
  explain(@Param('ticker') ticker: string) {
    return { ticker, explanation: this.radar.getTickerExplain(ticker) };
  }

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Belirli sembol için radar detayı' })
  getTicker(@Param('ticker') ticker: string) {
    return this.radar.getTickerDetail(ticker);
  }

  // R2-049: Submit user feedback for a radar opportunity
  @Post(':ticker/feedback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Radar fırsatı hakkında kullanıcı geri bildirimi (onay/redd/aba)' })
  async submitFeedback(@Param('ticker') ticker: string, @Body() feedbackDto: FeedbackDto) {
    const outcome = await this.radar.recordFeedback(
      `${ticker}_${new Date().toISOString()}`,
      feedbackDto.userAction,
      feedbackDto.explanation,
      feedbackDto.userId,
    );

    return {
      success: true,
      outcomeId: outcome.id,
      userAction: outcome.userAction,
      realizedOutcome: outcome.realizedOutcome,
      explanation: outcome.explanation,
      createdAt: outcome.createdAt,
    };
  }

  // R2-049: Activate a learned weight configuration version
  @Post('learned-configs/activate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Belirli sürümü öğrenilen ağırlık konfigürasyonunu aktifleştir' })
  async activateLearnedConfig(@Body() dto: ActivateLearnedConfigDto) {
    const activated = await this.radar.activateLearnedConfig(dto.version);

    return {
      success: true,
      version: activated.version,
      weightConfig: activated.weightConfig,
      evidenceCount: activated.evidenceCount,
      isActive: activated.isActive,
      rationale: activated.rationale,
    };
  }

  // R2-049: Reset learned state to previous version
  @Post('learned-reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ogrenilen state sifirla/geri al' })
  async resetLearnedState(@Body() dto: ResetLearnedStateDto) {
    await this.radar.resetLearnedState(dto.toVersion);

    return {
      success: true,
      resetToVersion: dto.toVersion,
      message: 'Learned state reset completed',
    };
  }
}
