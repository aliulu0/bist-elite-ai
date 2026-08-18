import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { EarlyOpportunityIntelligenceService } from './early-opportunity.intelligence.service';
import { MultiTimeframeOpportunityService } from './multi-timeframe/multi-timeframe.service';
import { SmartMoneyService } from '../smart-money/smart-money.service';
import { CatalystService } from '../catalyst/catalyst.service';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';
import { PredictionService } from '../prediction/prediction.service';
import { EliteScoreService } from '../ai-elite-score/elite-score.service';
import { EarlyOpportunityFilters, RiskLevel } from './early-opportunity.types';

interface TopListItem {
  ticker: string;
  name: string;
  sector: string;
  value: number;
  changePercent?: number;
}

interface TopListsData {
  smartMoney: TopListItem[];
  catalyst: TopListItem[];
  confidence: TopListItem[];
  expectedReturn: TopListItem[];
  eliteScore: TopListItem[];
  opportunity: TopListItem[];
  riskReward: TopListItem[];
}

@ApiTags('Top Lists')
@Controller('top-lists')
export class TopListsController {
  constructor(
    private readonly earlyOpportunityService: EarlyOpportunityIntelligenceService,
    private readonly multiTimeframeService: MultiTimeframeOpportunityService,
    private readonly smartMoneyService: SmartMoneyService,
    private readonly catalystService: CatalystService,
    private readonly symbolRegistry: SymbolRegistryService,
    private readonly predictionService: PredictionService,
    private readonly eliteScoreService: EliteScoreService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary:
      'Get top lists for smart money, catalyst, confidence, expected return, elite score, opportunity, risk/reward',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'minEarlyOpportunityScore', required: false, type: Number })
  @ApiQuery({ name: 'minConfidence', required: false, type: Number })
  @ApiQuery({ name: 'minExpectedReturn', required: false, type: Number })
  @ApiQuery({ name: 'maxRisk', required: false, enum: ['low', 'medium', 'high'] })
  @ApiQuery({ name: 'sector', required: false, type: String })
  @ApiQuery({ name: 'minEliteScore', required: false, type: Number })
  @ApiQuery({ name: 'minSmartMoneyScore', required: false, type: Number })
  async getTopLists(
    @Query('limit') limit?: string,
    @Query('minEarlyOpportunityScore') minEarlyOpportunityScore?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minExpectedReturn') minExpectedReturn?: string,
    @Query('maxRisk') maxRisk?: string,
    @Query('sector') sector?: string,
    @Query('minEliteScore') minEliteScore?: string,
    @Query('minSmartMoneyScore') minSmartMoneyScore?: string,
  ): Promise<TopListsData> {
    const listLimit = limit ? Number(limit) : 10;
    const filters: EarlyOpportunityFilters = {
      minEarlyOpportunityScore: minEarlyOpportunityScore
        ? Number(minEarlyOpportunityScore)
        : undefined,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
      minExpectedReturn: minExpectedReturn ? Number(minExpectedReturn) : undefined,
      maxRisk: maxRisk as RiskLevel | undefined,
      sector,
      minEliteScore: minEliteScore ? Number(minEliteScore) : undefined,
      minSmartMoneyScore: minSmartMoneyScore ? Number(minSmartMoneyScore) : undefined,
    };

    const symbols = this.symbolRegistry
      .getActiveSymbols()
      .filter((s: any) => s.active)
      .slice(0, 200);

    const symbolTickers = symbols.map((s: any) => s.canonicalTicker);

    // Get early opportunities for all symbols
    const earlyOpps = await this.earlyOpportunityService.getEarlyOpportunities(filters, {
      limit: 200,
    });
    const earlyOppsMap = new Map(earlyOpps.map((o: any) => [o.ticker, o]));

    // Get multi-timeframe for all symbols (sample)
    const mtfMap = new Map<string, any>();
    for (const ticker of symbolTickers.slice(0, 100)) {
      const mtf = await this.multiTimeframeService.analyze(ticker).catch(() => null);
      if (mtf) mtfMap.set(ticker, mtf);
    }

    // Get smart money for all symbols
    const smartMoneyMap = new Map<string, any>();
    for (const ticker of symbolTickers.slice(0, 100)) {
      const sm = await this.smartMoneyService.getSmartMoney(ticker, '1d').catch(() => null);
      if (sm) smartMoneyMap.set(ticker, sm);
    }

    // Get catalyst for all symbols
    const catalystMap = new Map<string, any>();
    for (const ticker of symbolTickers.slice(0, 100)) {
      const cat = await this.catalystService.getCatalyst(ticker).catch(() => null);
      if (cat) catalystMap.set(ticker, cat);
    }

    // Get elite scores
    const eliteScoreMap = new Map<string, any>();
    for (const ticker of symbolTickers.slice(0, 100)) {
      try {
        const es = await this.eliteScoreService.getByTicker(ticker);
        if (es) eliteScoreMap.set(ticker, es);
      } catch {
        // Ignore
      }
    }

    // Get predictions for confidence and expected return
    const predictionMap = new Map<string, any>();
    for (const ticker of symbolTickers.slice(0, 100)) {
      const pred = await this.predictionService.getPrediction(ticker, '1d').catch(() => null);
      if (pred?.isValid) predictionMap.set(ticker, pred);
    }

    // Build top lists
    const buildList = (
      items: Map<string, any>,
      getValue: (item: any) => number,
      getChangePercent?: (item: any) => number | undefined,
    ): TopListItem[] => {
      return Array.from(items.entries())
        .map(([ticker, data]) => {
          const symbol = symbols.find((s: any) => s.canonicalTicker === ticker);
          return {
            ticker,
            name: symbol?.companyName ?? ticker,
            sector: symbol?.sector ?? 'Diğer',
            value: getValue(data),
            changePercent: getChangePercent?.(data),
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, listLimit);
    };

    interface TopListItem {
      ticker: string;
      name: string;
      sector: string;
      value: number;
      changePercent?: number;
    }

    return {
      smartMoney: buildList(smartMoneyMap, (d: any) => d.smartMoneyScore),
      catalyst: buildList(catalystMap, (d: any) => d.catalystScore),
      confidence: buildList(predictionMap, (d: any) => d.confidence),
      expectedReturn: buildList(predictionMap, (d: any) => d.expectedReturn),
      eliteScore: buildList(eliteScoreMap, (d: any) => d.skor ?? d.score),
      opportunity: Array.from(earlyOppsMap.entries())
        .map(([ticker, data]) => {
          const symbol = symbols.find((s: any) => s.canonicalTicker === ticker);
          return {
            ticker,
            name: symbol?.companyName ?? ticker,
            sector: symbol?.sector ?? 'Diğer',
            value: data.earlyOpportunityScore,
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, listLimit),
      riskReward: buildList(predictionMap, (d: any) => {
        if (!d.entryZone || !d.stopZone || !d.target1) return 0;
        const entry = (d.entryZone.min + d.entryZone.max) / 2;
        if (entry <= d.stopZone) return 0;
        return (d.target1 - entry) / (entry - d.stopZone);
      }),
    };
  }
}
