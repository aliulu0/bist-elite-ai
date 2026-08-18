import { Injectable, Optional } from '@nestjs/common';
import { QuestionAnalyzerService, Intent } from './question-analyzer.service';
import { ChatResponseDto } from '../dto';
import { ScannerEngine } from '../../scanner/scanner-engine.service';
import { RankingEngine } from '../../ranking/ranking-engine.service';
import { MacroService } from '../../macro/macro.service';
import { PortfolioEngine } from '../../portfolio/engine/portfolio-engine.service';
import { AnalysisService } from '../../analysis-pipeline/analysis.service';

@Injectable()
export class AiAssistantService {
  private readonly suggestions: Record<string, string[]> = {
    stock_analysis: [
      'ASELS neden düştü?',
      'THYAO teknik analizi nedir?',
      'GARAN için al/sat önerisi nedir?',
      'Bu hisse neden AAA aldı?',
    ],
    portfolio: ['Portföyümü analiz et.', 'Portföy riski nedir?', 'Sektör dağılımım nasıl?'],
    macro: ['Makro riskler neler?', 'TCMB faiz kararı ne?', 'CDS ne durumda?'],
    sector: ['Bankacılık sektörü güçlü mü?', 'Savunma sektörü nasıl?', 'En iyi sektör hangisi?'],
    risk: ['Portföyümdeki riskler neler?', 'En riskli hisseler hangileri?'],
    scanner: [
      'Bugün en güvenli hisseler hangileri?',
      'Fırsatlar neler?',
      'Al sinyali veren hisseler?',
    ],
    ranking: ['En yüksek not alan hisseler?', 'Sıralama nasıl?'],
    opportunity: ['Yükseliş potansiyeli olan hisseler?', 'Fırsatlar neler?'],
    general: ['Genel durum nedir?', 'Piyasa nasıl?'],
  };

  constructor(
    private readonly questionAnalyzer: QuestionAnalyzerService,
    @Optional() private readonly scannerEngine?: ScannerEngine,
    @Optional() private readonly rankingEngine?: RankingEngine,
    @Optional() private readonly macroService?: MacroService,
    @Optional() private readonly portfolioEngine?: PortfolioEngine,
    @Optional() private readonly analysisService?: AnalysisService,
  ) {}

  async chat(message: string): Promise<ChatResponseDto> {
    const intent = this.questionAnalyzer.analyze(message);
    const sources: Array<{ name: string; type: string; confidence: number }> = [];
    const context: Record<string, unknown> = {};

    let answer: string;

    try {
      switch (intent.category) {
        case 'stock_analysis':
          answer = await this.handleStockAnalysis(intent, sources, context);
          break;
        case 'portfolio':
          answer = await this.handlePortfolio(intent, sources, context);
          break;
        case 'macro':
          answer = await this.handleMacro(intent, sources, context);
          break;
        case 'sector':
          answer = await this.handleSector(intent, sources, context);
          break;
        case 'risk':
          answer = await this.handleRisk(intent, sources, context);
          break;
        case 'scanner':
          answer = await this.handleScanner(intent, sources, context);
          break;
        case 'ranking':
          answer = await this.handleRanking(intent, sources, context);
          break;
        case 'opportunity':
          answer = await this.handleOpportunity(intent, sources, context);
          break;
        default:
          answer = await this.handleGeneral(intent, sources, context);
      }
    } catch (error) {
      answer = `Üzgünüm, sorgunuzu işlerken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`;
    }

    return {
      answer,
      sources,
      suggestions: this.suggestions[intent.category] || this.suggestions.general,
      context,
    };
  }

  private async handleStockAnalysis(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const symbol = intent.symbol || 'ASELS';
    const parts: string[] = [];
    const lower = intent.rawQuery.toLowerCase();

    if (this.analysisService) {
      try {
        const analysis = await this.analysisService.analyzeSymbol(symbol, '1d');
        sources.push({ name: 'Teknik Analiz', type: 'analysis_pipeline', confidence: 0.9 });
        sources.push({ name: 'Finansal Analiz', type: 'analysis_pipeline', confidence: 0.85 });
        sources.push({ name: 'Elite Score', type: 'analysis_pipeline', confidence: 0.95 });

        context.analysis = analysis;
        context.symbol = symbol;

        if (analysis.eliteScore) {
          const es = analysis.eliteScore;
          parts.push(`**${symbol} İçin Analiz Sonucu**\n`);
          parts.push(`📊 **Elite Score**: ${es.eliteScore} — ${es.rating} (${es.priority})`);
          parts.push(`   Güven: %${(es.confidence * 100).toFixed(0)}`);
          parts.push(`   Özet: ${es.summary}\n`);

          if (es.breakdown) {
            parts.push('**Bileşenler:**');
            parts.push(
              `   • Finansal: ${es.breakdown.financial.score} (katkı: %${(es.breakdown.financial.contribution * 100).toFixed(0)})`,
            );
            parts.push(
              `   • Teknik: ${es.breakdown.technical.score} (katkı: %${(es.breakdown.technical.contribution * 100).toFixed(0)})`,
            );
            parts.push(
              `   • Fırsat: ${es.breakdown.opportunity.score} (katkı: %${(es.breakdown.opportunity.contribution * 100).toFixed(0)})`,
            );
            parts.push(
              `   • Uyum: ${es.breakdown.confluence.score} (katkı: %${(es.breakdown.confluence.contribution * 100).toFixed(0)})`,
            );
            parts.push('');
          }
        }

        if (analysis.technicalSummary) {
          const ts = analysis.technicalSummary;
          parts.push(`**Teknik Analiz:** ${ts.overallOpinion}`);
          if (ts.strengths?.length) parts.push(`   ✅ Güçlü: ${ts.strengths.join(', ')}`);
          if (ts.weaknesses?.length) parts.push(`   ⚠️ Zayıf: ${ts.weaknesses.join(', ')}`);
          parts.push('');
        }

        if (analysis.financialSummary) {
          const fs = analysis.financialSummary;
          parts.push(`**Finansal Analiz:** ${fs.overallOpinion}`);
          if (fs.strengths?.length) parts.push(`   ✅ Güçlü: ${fs.strengths.join(', ')}`);
          if (fs.weaknesses?.length) parts.push(`   ⚠️ Zayıf: ${fs.weaknesses.join(', ')}`);
          parts.push('');
        }

        if (analysis.opportunity) {
          const opp = analysis.opportunity;
          parts.push(`**Fırsat Değerlendirmesi:**`);
          parts.push(`   Skor: ${opp.opportunityScore} — ${opp.opportunityLevel}`);
          parts.push(`   Erken Fırsat: ${opp.earlyOpportunity ? 'Evet' : 'Hayır'}`);
          if (opp.reasons?.length) parts.push(`   Nedenler: ${opp.reasons.join(', ')}`);
          if (opp.riskFactors?.length) parts.push(`   ⚠️ Riskler: ${opp.riskFactors.join(', ')}`);
          parts.push('');
        }

        if (analysis.confluence) {
          const conf = analysis.confluence;
          parts.push(`**Uyum (Confluence) Analizi:**`);
          parts.push(`   Uyum Skoru: ${conf.confluenceScore} — ${conf.agreement}`);
          parts.push(`   Finansal Uyum: ${conf.financialAlignment?.direction || 'N/A'}`);
          parts.push(`   Teknik Uyum: ${conf.technicalAlignment?.direction || 'N/A'}`);
        }

        if (parts.length === 1) {
          parts.push(`**${symbol}** için analiz tamamlandı ancak detaylı veri bulunamadı.`);
        }

        return parts.join('\n');
      } catch {
        return `**${symbol}** için analiz yapılırken veri alınamadı. Lütfen daha sonra tekrar deneyin.`;
      }
    }

    return `**${symbol}** için anlık analiz verisi mevcut değil. Lütfen daha sonra tekrar deneyin.`;
  }

  private async handlePortfolio(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const parts: string[] = ['**Portföy Analizi**\n'];

    if (this.portfolioEngine) {
      try {
        const portfolios = await this.portfolioEngine.getPortfolios();
        context.portfolios = portfolios;

        if (!portfolios || portfolios.length === 0) {
          parts.push('Henüz bir portföy oluşturulmamış.');
          return parts.join('\n');
        }

        for (const portfolio of portfolios) {
          let summary: any = null;
          let risk: any = null;
          let allocation: any = null;
          try {
            summary = this.portfolioEngine.getSummary(portfolio.id);
          } catch {}
          try {
            risk = this.portfolioEngine.getRisk(portfolio.id);
          } catch {}
          try {
            allocation = this.portfolioEngine.getAllocation(portfolio.id);
          } catch {}

          parts.push(`**${portfolio.name}**`);
          if (summary) {
            parts.push(`   💰 Toplam Değer: ${summary.totalValue?.toLocaleString() || 'N/A'} TL`);
            parts.push(`   📈 Getiri: %${(summary.totalReturnPercent || 0).toFixed(2)}`);
            parts.push(`   💵 Nakit: ${summary.cashBalance?.toLocaleString() || 'N/A'} TL`);
          }
          if (risk) {
            parts.push(`   ⚠️ Risk: ${risk.riskScore || 0}/100`);
            parts.push(`   📊 Volatilite: %${((risk.volatility || 0) * 100).toFixed(2)}`);
            if (risk.diversificationScore !== undefined)
              parts.push(`   🔀 Çeşitlendirme: ${risk.diversificationScore}/100`);
            parts.push(`   Sharpe Oranı: ${(risk.sharpeRatio || 0).toFixed(2)}`);
            parts.push(`   Max Drawdown: %${(risk.maxDrawdown || 0).toFixed(1)}`);
          }
          if (allocation) {
            parts.push(`   🏢 Sektör Dağılımı:`);
            if (allocation.sectors && allocation.sectors.length > 0) {
              const topSectors = allocation.sectors.slice(0, 5);
              for (const s of topSectors) {
                parts.push(`      ${s.sector}: %${(s.percentage || 0).toFixed(1)}`);
              }
            }
          }
          parts.push('');
        }

        sources.push({ name: 'Portföy Motoru', type: 'portfolio_engine', confidence: 0.95 });
      } catch {
        parts.push('Portföy verileri alınamadı.');
      }
    } else {
      parts.push('Portföy motoru şu anda kullanılamıyor.');
    }

    return parts.join('\n');
  }

  private async handleMacro(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const parts: string[] = ['**Makro Ekonomik Analiz**\n'];

    if (this.macroService) {
      try {
        const [macroData, macroScore, regime] = await Promise.all([
          this.macroService.getData().catch(() => null),
          this.macroService.getMacroScore().catch(() => null),
          this.macroService.getRegime().catch(() => null),
        ]);

        context.macro = { data: macroData, score: macroScore, regime };

        if (macroScore && macroScore.macroScore !== null) {
          parts.push(`📊 **Makro Skor**: ${macroScore.macroScore}/100`);
          sources.push({ name: 'Makro Skor', type: 'macro', confidence: 0.9 });
        } else {
          parts.push(`📊 **Makro Skor**: Veri yok`);
        }

        if (regime) {
          parts.push(`📈 **Piyasa Rejimi**: ${regime.regime || 'Veri yok'}`);
          parts.push(`   Güven: %${(((regime as any).confidence || 0) * 100).toFixed(0)}`);
          sources.push({ name: 'Piyasa Rejimi', type: 'macro', confidence: 0.85 });
        }

        if (macroData) {
          parts.push(`🔄 **Makro Veriler:**`);
          const indicators = (macroData as any).indicators || {};
          const keys = Object.keys(indicators).slice(0, 10);
          for (const key of keys) {
            const val = indicators[key];
            parts.push(`   • ${key}: ${typeof val === 'number' ? val.toFixed(2) : val}`);
          }
          sources.push({ name: 'Makro Veri', type: 'macro', confidence: 0.8 });
        }

        const alerts = await this.macroService.getAlerts().catch(() => []);
        if (alerts && alerts.length > 0) {
          parts.push(`\n🔔 **Makro Uyarılar:**`);
          for (const alert of alerts.slice(0, 5)) {
            parts.push(
              `   ${alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🟢'} ${alert.message || JSON.stringify(alert)}`,
            );
          }
          sources.push({ name: 'Makro Uyarılar', type: 'macro', confidence: 0.85 });
        }

        parts.push('');
      } catch {
        parts.push('Makro analiz verileri alınamadı.');
      }
    } else {
      parts.push('Makro analiz motoru şu anda kullanılamıyor.');
    }

    return parts.join('\n');
  }

  private async handleSector(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const parts: string[] = ['**Sektör Analizi**\n'];

    if (this.macroService) {
      try {
        const sectorImpacts = await this.macroService.getSectorImpacts().catch(() => null);
        if (sectorImpacts) {
          context.sectorImpacts = sectorImpacts;
          parts.push('**Sektör Bazında Makro Etkiler:**');
          const entries = Array.isArray(sectorImpacts)
            ? sectorImpacts
            : Object.entries(sectorImpacts);
          for (const entry of entries.slice(0, 10)) {
            const [name, data] = Array.isArray(entry) ? entry : [entry, {}];
            const impact =
              typeof data === 'object' && data !== null
                ? (data as Record<string, unknown>).impact || ''
                : '';
            const score =
              typeof data === 'object' && data !== null
                ? (data as Record<string, unknown>).score
                : '';
            parts.push(
              `   • ${name}: ${impact ? ` ${impact}` : ''}${score ? ` (skor: ${score})` : ''}`,
            );
          }
          sources.push({ name: 'Sektör Etkileri', type: 'macro', confidence: 0.8 });
        } else {
          parts.push('Sektör verisi mevcut değil.');
        }
      } catch {
        parts.push('Sektör analizi alınamadı.');
      }
    } else {
      parts.push('Sektör analizi motoru şu anda kullanılamıyor.');
    }

    return parts.join('\n');
  }

  private async handleRisk(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const parts: string[] = ['**Risk Analizi**\n'];

    if (this.portfolioEngine) {
      try {
        const portfolios = await this.portfolioEngine.getPortfolios();
        if (portfolios && portfolios.length > 0) {
          for (const portfolio of portfolios) {
            let risk: any = null;
            try {
              risk = this.portfolioEngine.getRisk(portfolio.id);
            } catch {}
            if (risk) {
              context.risk = risk;
              parts.push(`**${portfolio.name}**`);
              parts.push(`   ⚠️ Risk Skoru: ${risk.riskScore || 0}/100`);
              parts.push(`   📊 Volatilite: %${((risk.volatility || 0) * 100).toFixed(2)}`);
              parts.push(`   Sharpe Oranı: ${(risk.sharpeRatio || 0).toFixed(2)}`);
              parts.push(`   Max Drawdown: %${(risk.maxDrawdown || 0).toFixed(1)}`);
              parts.push(`   VAR (95%): %${((risk.valueAtRisk || 0) * 100).toFixed(1)}`);
              parts.push(`   Çeşitlendirme: ${risk.diversificationScore || 0}/100`);
              parts.push('');
              sources.push({ name: 'Risk Metrikleri', type: 'portfolio_engine', confidence: 0.9 });
            }
          }
        }

        if (!parts[1]) {
          parts.push('Risk verisi alınamadı veya portföy bulunamadı.');
        }
      } catch {
        parts.push('Risk analizi alınamadı.');
      }
    } else {
      parts.push('Risk analizi motoru şu anda kullanılamıyor.');
    }

    return parts.join('\n');
  }

  private async handleScanner(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const parts: string[] = ['**Tarama Sonuçları**\n'];

    if (this.scannerEngine) {
      try {
        const candidates = (this.scannerEngine as any).getCandidates?.() || [];
        context.candidates = candidates;

        if (candidates.length > 0) {
          const sorted = [...candidates].sort((a, b) => (b.score || 0) - (a.score || 0));
          parts.push(`🔍 **En İyi ${Math.min(10, sorted.length)} Fırsat:**`);
          for (let i = 0; i < Math.min(10, sorted.length); i++) {
            const c = sorted[i];
            parts.push(
              `   ${i + 1}. **${c.symbol}** — Skor: ${c.score}${c.reason ? ` (${c.reason})` : ''}`,
            );
          }
          sources.push({ name: 'Tarayıcı Motoru', type: 'scanner', confidence: 0.9 });
        } else {
          parts.push('Tarama sonucu bulunamadı.');
        }
      } catch {
        parts.push('Tarama motoru çalıştırılamadı.');
      }
    } else {
      parts.push('Tarama motoru şu anda kullanılamıyor.');
    }

    return parts.join('\n');
  }

  private async handleRanking(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const parts: string[] = ['**Sıralama (Ranking) Sonuçları**\n'];

    if (this.rankingEngine) {
      try {
        const ranked = (this.rankingEngine as any).getRanked?.() || [];
        context.ranked = ranked;

        if (ranked.length > 0) {
          parts.push(`🏆 **En Yüksek Not Alanlar:**`);
          for (let i = 0; i < Math.min(10, ranked.length); i++) {
            const r = ranked[i];
            parts.push(
              `   ${i + 1}. **${r.symbol}** — ${r.grade || 'N/A'} | Skor: ${r.score || 0} | ${r.recommendation || 'N/A'}`,
            );
          }
          sources.push({ name: 'Sıralama Motoru', type: 'ranking', confidence: 0.9 });
        } else {
          parts.push('Sıralama verisi bulunamadı.');
        }
      } catch {
        parts.push('Sıralama motoru çalıştırılamadı.');
      }
    } else {
      parts.push('Sıralama motoru şu anda kullanılamıyor.');
    }

    return parts.join('\n');
  }

  private async handleOpportunity(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const parts: string[] = ['**Fırsat Analizi**\n'];

    if (this.rankingEngine) {
      try {
        const ranked = (this.rankingEngine as any).getRanked?.() || [];
        const opportunities = ranked.filter(
          (r: any) => r.recommendation === 'STRONG_BUY' || r.recommendation === 'BUY',
        );
        context.opportunities = opportunities;

        if (opportunities.length > 0) {
          parts.push(`🚀 **Al Sinyali Veren Hisseler:**`);
          for (const opp of opportunities.slice(0, 10)) {
            parts.push(
              `   • **${opp.symbol}** — ${opp.grade} | Skor: ${opp.score} | Öneri: ${opp.recommendation}`,
            );
          }
          sources.push({ name: 'Fırsat Motoru', type: 'ranking', confidence: 0.85 });
        } else {
          parts.push('Şu an için al sinyali veren hisse bulunamadı.');
        }
      } catch {
        parts.push('Fırsat analizi alınamadı.');
      }
    } else {
      parts.push('Fırsat analizi motoru şu anda kullanılamıyor.');
    }

    return parts.join('\n');
  }

  private async handleGeneral(
    intent: Intent,
    sources: Array<{ name: string; type: string; confidence: number }>,
    context: Record<string, unknown>,
  ): Promise<string> {
    const parts: string[] = ['**Genel Durum**\n'];
    parts.push('BIST Elite AI, Borsa İstanbul için gelişmiş yatırım analiz platformudur.\n');
    parts.push('**Sorabileceğiniz sorular:**');
    parts.push('   🔍 **Hisse Analizi:** "ASELS neden düştü?", "THYAO teknik analizi nedir?"');
    parts.push('   💼 **Portföy:** "Portföyümü analiz et.", "Portföy riski nedir?"');
    parts.push('   📊 **Makro:** "Makro riskler neler?", "TCMB faiz kararı ne?"');
    parts.push('   🏢 **Sektör:** "Bankacılık sektörü güçlü mü?"');
    parts.push('   🎯 **Tarama:** "Bugün en güvenli hisseler hangileri?"');
    parts.push('   ⭐ **Sıralama:** "En yüksek not alan hisseler?"');
    return parts.join('\n');
  }
}
