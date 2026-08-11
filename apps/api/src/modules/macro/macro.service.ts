import { Injectable, Logger } from '@nestjs/common';
import { MacroAnalysisService } from './macro-analysis.service';
import { MacroDataService } from './macro-data.service';
import { MacroEliteScoreService } from './macro-elite-score.service';
import { CombinedConfidenceService } from './combined-confidence.service';
import { TCMBDecisionCaptureService } from './tcmb-decision-capture.service';
import { TCMBDecisionStoreService } from './tcmb-decision-store.service';
import {
  CentralBank,
  MacroDataSnapshot,
  MacroScoreResult,
  MarketRegimeAnalysis,
  CombinedConfidence,
  CentralBankAnalysis,
  SectorImpact,
  MacroAlertEvent,
  MacroOpportunity,
  MacroRiskItem,
  MarketImpact,
  MarketRegimeType,
} from './macro.types';
import {
  MacroEliteResult,
  MacroRecommendation,
  MacroTrendResult,
  CombinedConfidenceResult,
  TCMBDecisionRecord,
} from './macro-elite.types';
import { MacroDashboardBundleDto } from './dto/macro-dashboard.dto';

@Injectable()
export class MacroService {
  private readonly logger = new Logger(MacroService.name);

  constructor(
    private readonly analysis: MacroAnalysisService,
    private readonly dataService: MacroDataService,
    private readonly eliteService: MacroEliteScoreService,
    private readonly combinedConfidenceService: CombinedConfidenceService,
    private readonly captureService: TCMBDecisionCaptureService,
    private readonly decisionStore: TCMBDecisionStoreService,
  ) {}

  async getFullAnalysis() {
    return this.analysis.getFullAnalysis();
  }

  async getData(): Promise<MacroDataSnapshot> {
    return this.dataService.fetchAll();
  }

  async getMacroScore(): Promise<MacroScoreResult> {
    return this.analysis.getMacroScore();
  }

  async getRegime(): Promise<MarketRegimeAnalysis> {
    return this.analysis.getRegime();
  }

  async getCentralBankAnalysis(bank: CentralBank): Promise<CentralBankAnalysis> {
    return this.analysis.getCentralBankAnalysis(bank);
  }

  async getCombinedConfidence(eliteScore: number): Promise<CombinedConfidence> {
    return this.analysis.getCombinedConfidence(eliteScore);
  }

  async getMacroEliteScore(): Promise<MacroEliteResult> {
    await this.captureService.captureLatest();
    return this.eliteService.calculate();
  }

  async getMacroTrend(): Promise<MacroTrendResult> {
    await this.captureService.captureLatest();
    return this.eliteService.getTrend();
  }

  async getCombinedMacroConfidence(eliteConfidence?: number): Promise<CombinedConfidenceResult> {
    const elite = await this.getMacroEliteScore();
    return this.combinedConfidenceService.calculate(
      eliteConfidence ?? MacroService.DEFAULT_ELITE_CONFIDENCE,
      elite.confidence,
    );
  }

  async getMacroRecommendation(): Promise<MacroRecommendation> {
    const elite = await this.getMacroEliteScore();
    return elite.recommendation;
  }

  async getDecisionHistory(limit = 20): Promise<{ decisions: TCMBDecisionRecord[]; total: number }> {
    return {
      decisions: this.decisionStore.list(limit),
      total: this.decisionStore.count(),
    };
  }

  async getDashboard(): Promise<MacroDashboardBundleDto> {
    await this.captureService.captureLatest();
    const elite = await this.eliteService.calculate();
    const [snapshot, sectors, alerts, regime, combined, observability] = await Promise.all([
      this.dataService.fetchAll(),
      this.getSectorImpacts(),
      this.getAlerts(),
      this.getRegime(),
      this.combinedConfidenceService.calculate(MacroService.DEFAULT_ELITE_CONFIDENCE, elite.confidence),
      this.eliteService.getObservability(),
    ]);

    const policyRate = snapshot.points.find((p) => p.source === 'tcmb_policy_rate') ?? null;
    const decisionText = snapshot.points.find((p) => p.source === 'tcmb_decision_text') ?? null;
    const decisionHistory = this.decisionStore.list(20);

    return {
      snapshot: {
        macroScore: elite.eliteScore,
        regime: regime.regime,
        tcmb: {
          policyRate,
          decisionText,
          lastDecision: elite.decision?.analysis ?? null,
        },
        keyIndicators: snapshot.points,
        fetchedAt: snapshot.fetchedAt,
      },
      history: [],
      decisionHistory: { decisions: decisionHistory, total: this.decisionStore.count() },
      alerts: alerts.map((a) => ({ ...a })),
      sectors: sectors.map((s) => ({
        sector: s.sector,
        impact: s.impact,
        impactScore: s.score,
        bestScore: 0,
        scoreSource: 'unavailable' as const,
        drivers: s.drivers ?? [],
        updatedAt: elite.calculatedAt,
      })),
      elite: {
        score: elite.eliteScore,
        confidence: elite.confidence,
        trend: elite.trend,
        riskLevel: elite.risk.level,
        recommendation: elite.recommendation.action,
        lastUpdated: elite.calculatedAt,
      },
      trendCard: {
        trend: elite.trend,
        change: 0,
        currentScore: elite.eliteScore,
        previousScore: null,
        drivers: elite.recommendation.reasons,
        timestamp: elite.calculatedAt,
      },
      riskCard: {
        level: elite.risk.level,
        score: elite.risk.score,
        drivers: elite.risk.drivers,
        timestamp: elite.calculatedAt,
      },
      opportunities: (await this.getOpportunities(75)).map((o) => ({
        ticker: o.ticker,
        name: o.name,
        sector: o.sector,
        eliteScore: o.eliteScore,
        macroScore: o.macroScore,
        combinedConfidence: o.combinedConfidence,
        priority: o.priority,
        sectorImpact: o.sectorImpact,
      })),
      recommendation: elite.recommendation,
      combinedConfidence: {
        eliteConfidence: elite.confidence,
        macroConfidence: combined.macroConfidence,
        combined: combined.combined,
        weightElite: combined.weightElite,
        weightMacro: combined.weightMacro,
        calculatedAt: combined.calculatedAt,
      },
      observability,
      raw: snapshot,
    };
  }

  private static readonly DEFAULT_ELITE_CONFIDENCE = 0.7;

  async getSectorImpacts(): Promise<SectorImpact[]> {
    const full = await this.analysis.getFullAnalysis();
    return full.sectors;
  }

  async getAlerts(): Promise<MacroAlertEvent[]> {
    const full = await this.analysis.getFullAnalysis();
    const alerts: MacroAlertEvent[] = [];

    if (full.regime.regime === 'extreme_risk') {
      alerts.push({
        id: `macro-${Date.now()}-extreme-risk`,
        type: 'macro_alert',
        title: 'Extreme Risk Regime Detected',
        message: `Market regime switched to EXTREME RISK. VIX: ${full.regime.components.vix.value}, CDS: ${full.regime.components.cds.value}`,
        severity: 'critical',
        source: 'vix',
        timestamp: new Date().toISOString(),
      });
    }

    if (full.regime.regime === 'risk_off') {
      alerts.push({
        id: `macro-${Date.now()}-risk-off`,
        type: 'macro_alert',
        title: 'Risk Off Regime Active',
        message: `Market regime is RISK OFF. Signals: ${full.regime.signals.join(', ')}`,
        severity: 'warning',
        source: 'vix',
        timestamp: new Date().toISOString(),
      });
    }

    if (full.tcmb.tone === 'hawkish') {
      alerts.push({
        id: `macro-${Date.now()}-tcmb-hawkish`,
        type: 'macro_alert',
        title: 'TCMB Turned Hawkish',
        message: `TCMB decision analyzed as hawkish. Market impact: negative.`,
        severity: 'warning',
        source: 'tcmb',
        timestamp: new Date().toISOString(),
      });
    }

    if (full.fed.tone === 'hawkish') {
      alerts.push({
        id: `macro-${Date.now()}-fed-hawkish`,
        type: 'macro_alert',
        title: 'FED Turned Hawkish',
        message: `FOMC statement analyzed as hawkish. Market impact: negative.`,
        severity: 'warning',
        source: 'fed',
        timestamp: new Date().toISOString(),
      });
    }

    if (full.regime.components.vix.value >= 25) {
      alerts.push({
        id: `macro-${Date.now()}-vix-spike`,
        type: 'macro_alert',
        title: 'VIX Spike Detected',
        message: `VIX at ${full.regime.components.vix.value}. Elevated volatility may impact positions.`,
        severity: 'warning',
        source: 'vix',
        timestamp: new Date().toISOString(),
      });
    }

    if (full.regime.components.cds.value >= 400) {
      alerts.push({
        id: `macro-${Date.now()}-cds-spike`,
        type: 'macro_alert',
        title: 'CDS Spike Detected',
        message: `Turkey CDS at ${full.regime.components.cds.value} bps. Country risk elevated.`,
        severity: 'critical',
        source: 'turkey_cds',
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }

  async getOpportunities(eliteScore = 75): Promise<MacroOpportunity[]> {
    const [macroScore, sectors] = await Promise.all([
      this.getMacroScore(),
      this.getSectorImpacts(),
    ]);
    const combined = this.analysis['confidenceEngine'].calculate(eliteScore, macroScore.macroScore);

    const sectorMap = new Map(sectors.map((s) => [s.sector, s]));
    const sampleTickers = [
      { ticker: 'AKBNK', name: 'Akbank', sector: 'Banking', eliteScore: 78 },
      { ticker: 'GARAN', name: 'Garanti BBVA', sector: 'Banking', eliteScore: 82 },
      { ticker: 'EREGL', name: 'Ereğli Demir Çelik', sector: 'Industrial', eliteScore: 65 },
      { ticker: 'THYAO', name: 'Türk Hava Yolları', sector: 'Transportation', eliteScore: 71 },
      { ticker: 'ASELS', name: 'Aselsan', sector: 'Defense', eliteScore: 88 },
      { ticker: 'KCHOL', name: 'Koç Holding', sector: 'Holding', eliteScore: 74 },
    ];

    return sampleTickers.map((t) => {
      const sectorInfo = sectorMap.get(t.sector);
      const impact: MarketImpact = sectorInfo?.impact || 'neutral';
      const conf = this.analysis['confidenceEngine'].calculate(t.eliteScore, macroScore.macroScore);

      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (conf.combined >= 70) priority = 'high';
      else if (conf.combined < 45) priority = 'low';

      return {
        ticker: t.ticker,
        name: t.name,
        sector: t.sector,
        eliteScore: t.eliteScore,
        macroScore: macroScore.macroScore,
        combinedConfidence: conf.combined,
        reason: `Sector: ${t.sector} (${impact.toUpperCase()}), Macro: ${macroScore.macroScore.toFixed(1)}`,
        sectorImpact: impact,
        priority,
        timestamp: new Date().toISOString(),
      };
    });
  }

  async getRisk(): Promise<MacroRiskItem[]> {
    const [macroScore, sectors, regime] = await Promise.all([
      this.getMacroScore(),
      this.getSectorImpacts(),
      this.getRegime(),
    ]);

    const weakSectors = sectors.filter((s) => s.impact === 'negative');
    const riskItems: MacroRiskItem[] = [];

    for (const sector of weakSectors) {
      riskItems.push({
        ticker: 'N/A',
        name: `${sector.sector} stocks`,
        sector: sector.sector,
        riskType: 'weak_sector',
        riskDescription: `Sector negatively impacted by current macro conditions (score: ${sector.score})`,
        macroScore: macroScore.macroScore,
        severity: regime.regime,
        timestamp: new Date().toISOString(),
      });
    }

    if (macroScore.macroScore < 40 || regime.regime === 'extreme_risk') {
      riskItems.push({
        ticker: 'BIST-100',
        name: 'BIST 100 Index',
        sector: 'Broad Market',
        riskType: 'high_macro_risk',
        riskDescription: `Elevated macro risk: score=${macroScore.macroScore.toFixed(1)}, regime=${regime.regime}`,
        macroScore: macroScore.macroScore,
        severity: regime.regime,
        timestamp: new Date().toISOString(),
      });
    }

    if (regime.components.cds.value > 300) {
      riskItems.push({
        ticker: 'USDTRY',
        name: 'USD/TRY',
        sector: 'Currency',
        riskType: 'currency_sensitive',
        riskDescription: `Turkey CDS elevated at ${regime.components.cds.value}, TRY depreciation risk`,
        macroScore: macroScore.macroScore,
        severity: regime.regime,
        timestamp: new Date().toISOString(),
      });
    }

    if (regime.components.dxy.impact > 0.5) {
      riskItems.push({
        ticker: 'N/A',
        name: 'Exporters',
        sector: 'Export',
        riskType: 'global_risk_exposed',
        riskDescription: `Strong DXY (${regime.components.dxy.value}) pressures EM currencies, hurting exporters`,
        macroScore: macroScore.macroScore,
        severity: regime.regime,
        timestamp: new Date().toISOString(),
      });
    }

    return riskItems;
  }
}
