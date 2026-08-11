import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { PredictionService } from '../prediction/prediction.service';
import { AIResearchHubService } from '../ai-research/ai-research-hub.service';
import { VerificationAIService } from '../verification-ai/verification-ai.service';
import { CatalystService } from '../catalyst/catalyst.service';
import { SmartMoneyService } from '../smart-money/smart-money.service';
import { EntryService } from '../entry/entry.service';
import { BacktestService } from '../backtest/backtest.service';
import { MultiTimeframeOpportunityService } from './multi-timeframe/multi-timeframe.service';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';
import { PredictionTimeframe } from '../prediction/prediction.types';

interface QuickSearchResult {
  ticker: string;
  name: string;
  prediction: {
    bullishPercent: number;
    confidence: number;
    expectedReturn: number;
    trend: string;
    momentum: string;
  };
  research: { consensus: string; agreementLevel: number };
  verification: { status: string; details: string };
  catalyst: { score: number; verified: boolean; summary: string };
  smartMoney: { score: number; accumulation: string };
  entry: { zone: { min: number; max: number }; stop: number; target1: number; target2: number };
  backtest: { winRate: number; totalTrades: number; sharpeRatio: number };
  multiTimeframe: { timeframes: PredictionTimeframe[]; scores: Record<PredictionTimeframe, number> };
}

@ApiTags('Quick Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly predictionService: PredictionService,
    private readonly researchHub: AIResearchHubService,
    private readonly verificationAI: VerificationAIService,
    private readonly catalystService: CatalystService,
    private readonly smartMoneyService: SmartMoneyService,
    private readonly entryService: EntryService,
    private readonly backtestService: BacktestService,
    private readonly multiTimeframeService: MultiTimeframeOpportunityService,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  @Get(':ticker')
  @Public()
  @ApiOperation({ summary: 'Quick search - get comprehensive analysis for a ticker instantly' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol (e.g., ASELS, THYAO, GARAN)' })
  async search(@Param('ticker') ticker: string): Promise<QuickSearchResult | null> {
    const normalized = ticker.toUpperCase();
    const symbol = this.symbolRegistry.getSymbol(normalized);
    if (!symbol) {
      return null;
    }

    // Fetch all data in parallel
    const [
      prediction1d,
      consensus,
      verification,
      catalyst,
      smartMoney,
      multiTimeframe,
      entry,
      backtest,
    ] = await Promise.all([
      this.predictionService.getPrediction(normalized, '1d'),
      this.researchHub.getConsensus(normalized).catch(() => null),
      this.verificationAI.getVerification(normalized).catch(() => null),
      this.catalystService.getCatalyst(normalized).catch(() => null),
      this.smartMoneyService.getSmartMoney(normalized, '1d').catch(() => null),
      this.multiTimeframeService.analyze(normalized).catch(() => null),
      this.entryService.getByTicker(normalized).catch(() => null),
      Promise.resolve()
        .then(() => this.backtestService.getReport(normalized, '1d'))
        .catch(() => null),
    ]);

    if (!prediction1d || !prediction1d.isValid) {
      return null;
    }

    // Multi-timeframe scores
    const mtfScores: Record<PredictionTimeframe, number> = {} as any;
    if (multiTimeframe) {
      for (const tf of ['1h', '2h', '4h', '1d', '1w', '1m', '3m', '6m'] as PredictionTimeframe[]) {
        const pred = await this.predictionService.getPrediction(normalized, tf).catch(() => null);
        if (pred?.isValid) {
          mtfScores[tf] = pred.bullishProbability;
        }
      }
    }

    return {
      ticker: normalized,
      name: symbol.companyName,
      prediction: {
        bullishPercent: prediction1d.bullishProbability,
        confidence: prediction1d.confidence,
        expectedReturn: prediction1d.expectedReturn,
        trend: prediction1d.trendDirection,
        momentum: prediction1d.momentum,
      },
      research: {
        consensus: consensus?.newsSummary ?? 'No consensus available',
        agreementLevel: consensus?.agreementLevel ?? 0,
      },
      verification: {
        status: verification?.verified ?? 'unknown',
        details: verification?.verificationReason ?? 'No verification data',
      },
      catalyst: {
        score: catalyst?.catalystScore ?? 0,
        verified: (catalyst?.verifiedCount ?? 0) > 0,
        summary: catalyst?.events?.[0]?.description ?? 'No catalyst data',
      },
      smartMoney: {
        score: smartMoney?.smartMoneyScore ?? 0,
        accumulation: smartMoney?.accumulationLevel ?? 'unknown',
      },
      entry: {
        zone: entry ? { min: entry.idealEntryZone?.min ?? 0, max: entry.idealEntryZone?.max ?? 0 } : { min: 0, max: 0 },
        stop: entry?.stopLoss ?? 0,
        target1: entry?.target1 ?? 0,
        target2: entry?.target2 ?? 0,
      },
      backtest: {
        winRate: (backtest?.result?.winRate as number) ?? 0,
        totalTrades: (backtest?.result?.totalTrades as number) ?? 0,
        sharpeRatio: (backtest?.result?.sharpeRatio as number) ?? 0,
      },
      multiTimeframe: {
        timeframes: Object.keys(mtfScores) as PredictionTimeframe[],
        scores: mtfScores,
      },
    };
  }
}