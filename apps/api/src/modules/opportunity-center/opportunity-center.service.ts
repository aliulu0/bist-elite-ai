import { Injectable } from '@nestjs/common';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { EliteScoreEngine } from '../ai-elite-score/elite-score.engine';
import { EliteScoreHorizon } from '../ai-elite-score/elite-score.types';
import { EntryService } from '../entry/entry.service';
import { AnalystService } from '../analyst/analyst.service';
import { toOpportunityCenterCard } from './opportunity-center.dto';
import { OpportunityCenterRegistry } from './opportunity-center.registry';
import {
  ELITE_SCORE_TIMEFRAMES,
  OPPORTUNITY_CENTER_TABS,
  OpportunityCenterCard,
  OpportunityCenterTabId,
  EliteScoreCard,
  EliteScoreTimeframeResult,
} from './opportunity-center.types';

const BREAKDOWN_KEY = {
  GUNLUK: 'gunluk',
  HAFTALIK: 'haftalik',
  AYLIK: 'aylik',
  UC_AYLIK: 'ucAylik',
  ALTI_AYLIK: 'altiAylik',
} as const;

@Injectable()
export class OpportunityCenterService {
  constructor(
    private readonly opportunityRegistry: OpportunityRegistry,
    private readonly centerRegistry: OpportunityCenterRegistry,
    private readonly eliteScoreEngine: EliteScoreEngine,
    private readonly entryService: EntryService,
    private readonly analystService: AnalystService,
  ) {}

  sync(): void {
    for (const entry of this.opportunityRegistry.getAll()) {
      const entryArea = this.entryService.getCached(entry.ticker);
      const analyst = this.analystService.getCached(entry.ticker);
      this.centerRegistry.set({
        ticker: entry.ticker,
        kart: toOpportunityCenterCard(entry.result, entryArea, analyst),
        evaluatedAt: entry.evaluatedAt,
      });
    }
  }

  today(): OpportunityCenterCard[] {
    return this.centerRegistry.top(100);
  }

  tomorrow(): OpportunityCenterCard[] {
    return this.centerRegistry.getTomorrowEntries().map((e) => e.kart);
  }

  top10(): OpportunityCenterCard[] {
    return this.centerRegistry.top(10);
  }

  top20(): OpportunityCenterCard[] {
    return this.centerRegistry.top(20);
  }

  weekly(): OpportunityCenterCard[] {
    return this.centerRegistry.top(100);
  }

  monthly(): OpportunityCenterCard[] {
    return this.centerRegistry.top(100);
  }

  threeMonth(): OpportunityCenterCard[] {
    return this.centerRegistry.top(100);
  }

  sixMonth(): OpportunityCenterCard[] {
    return this.centerRegistry.top(100);
  }

  momentum(): OpportunityCenterCard[] {
    return this.byStrategy('momentum');
  }

  value(): OpportunityCenterCard[] {
    return this.byStrategy('value-hunter');
  }

  smartMoney(): OpportunityCenterCard[] {
    return this.byStrategy('smart-money');
  }

  eliteScore(): EliteScoreTimeframeResult[] {    const cards = this.centerRegistry.getAll().map((e) => e.kart);
    const computed = cards.map((kart) => {
      const elite = this.eliteScoreEngine.evaluate(kart);
      const scoreMap = new Map<EliteScoreHorizon, number>(
        elite.horizons.map((h) => [h.horizon, h.skor]),
      );
      return { kart, scoreMap };
    });
    return ELITE_SCORE_TIMEFRAMES.map((t) => {
      const horizon = t.zaman as EliteScoreHorizon;
      const enriched: EliteScoreCard[] = computed.map((c) => ({
        ...c.kart,
        eliteScore: {
          gunluk: c.scoreMap.get('GUNLUK') ?? 0,
          haftalik: c.scoreMap.get('HAFTALIK') ?? 0,
          aylik: c.scoreMap.get('AYLIK') ?? 0,
          ucAylik: c.scoreMap.get('UC_AYLIK') ?? 0,
          altiAylik: c.scoreMap.get('ALTI_AYLIK') ?? 0,
        },
      }));
      const scores = enriched.map((e) => e.eliteScore[BREAKDOWN_KEY[horizon]]);
      const skor =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      return { zaman: t.zaman, etiket: t.etiket, skor, kartlar: enriched };
    });
  }

  hub(): OpportunityCenterHub {
    const sections = OPPORTUNITY_CENTER_TABS.map((tab) => ({
      tabId: tab.id,
      baslik: tab.baslik,
      emoji: tab.emoji,
      aciklama: tab.description,
      kartSayisi: this.tabCards(tab.id).length,
      kartlar: this.tabCards(tab.id),
    }));
    return {
      baslik: 'AI Fırsat Merkezi',
      olusturmaZamani: new Date().toISOString(),
      toplamKart: this.centerRegistry.count(),
      sekmeler: sections,
    };
  }

  private byStrategy(strategyId: string): OpportunityCenterCard[] {
    return this.centerRegistry
      .getAll()
      .map((e) => e.kart)
      .filter((k) => k.strategyId === strategyId)
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  private tabCards(tabId: OpportunityCenterTabId): OpportunityCenterCard[] {
    switch (tabId) {
      case 'BUGUNUN_FIRSATLARI':
        return this.today();
      case 'YARIN_ARTACAKLAR':
        return this.tomorrow();
      case 'TOP_10':
        return this.top10();
      case 'TOP_20':
        return this.top20();
      case 'MOMENTUM':
        return this.momentum();
      case 'DEGER_AVCILARI':
        return this.value();
      case 'SMART_MONEY':
        return this.smartMoney();
      case 'HAFTALIK':
        return this.weekly();
      case 'AYLIK':
        return this.monthly();
      case 'UC_AYLIK':
        return this.threeMonth();
      case 'ALTI_AYLIK':
        return this.sixMonth();
      case 'ELITE_SCORE':
        return [];
      default:
        return [];
    }
  }
}

export interface OpportunityCenterHub {
  baslik: string;
  olusturmaZamani: string;
  toplamKart: number;
  sekmeler: OpportunityCenterTabSection[];
}

export interface OpportunityCenterTabSection {
  tabId: OpportunityCenterTabId;
  baslik: string;
  emoji: string;
  aciklama: string;
  kartSayisi: number;
  kartlar: OpportunityCenterCard[];
}
