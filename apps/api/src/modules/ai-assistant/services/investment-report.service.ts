import { Injectable, Optional } from '@nestjs/common';
import { AnalysisService } from '../../analysis-pipeline/analysis.service';
import { MacroService } from '../../macro/macro.service';

export interface InvestmentReport {
  title: string;
  generatedAt: string;
  symbol: string;
  sections: ReportSection[];
  markdown: string;
}

export interface ReportSection {
  title: string;
  content: string;
  level: number;
}

@Injectable()
export class InvestmentReportService {
  constructor(
    @Optional() private readonly analysisService?: AnalysisService,
    @Optional() private readonly macroService?: MacroService,
  ) {}

  async generateReport(symbol: string, timeframe: string = '1d'): Promise<InvestmentReport> {
    const timestamp = new Date().toISOString();
    const sections: ReportSection[] = [];
    const lines: string[] = [];

    lines.push(`# ${symbol} — Yatırım Raporu`);
    lines.push(`**Oluşturulma Tarihi:** ${new Date(timestamp).toLocaleDateString('tr-TR')}`);
    lines.push(`**Sembol:** ${symbol}`);
    lines.push(`**Zaman Dilimi:** ${timeframe}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    sections.push({ title: 'Giriş', content: `${symbol} yatırım raporu.`, level: 1 });

    let analysis: Record<string, unknown> | null = null;
    if (this.analysisService) {
      try {
        analysis = (await this.analysisService.analyzeSymbol(symbol, timeframe as any)) as unknown as Record<string, unknown>;
      } catch { /* ignore */ }
    }

    let macroData: Record<string, unknown> | null = null;
    if (this.macroService) {
      try {
        macroData = await this.macroService.getData() as unknown as Record<string, unknown>;
      } catch { /* ignore */ }
    }

    if (analysis) {
      const eliteScore = analysis.eliteScore as Record<string, unknown> | undefined;
      if (eliteScore) {
        lines.push('## 1. Şirket Özeti');
        lines.push('');
        lines.push(`**Elite Score:** ${eliteScore.eliteScore} — ${eliteScore.rating}`);
        lines.push(`**Öncelik:** ${eliteScore.priority}`);
        lines.push(`**Güven Seviyesi:** %${((eliteScore.confidence as number || 0) * 100).toFixed(0)}`);
        lines.push(`**Değerlendirme:** ${eliteScore.summary || 'N/A'}`);
        lines.push('');

        const breakdown = eliteScore.breakdown as Record<string, unknown> | undefined;
        if (breakdown) {
          lines.push('**Elite Score Bileşenleri:**');
          lines.push('');
          lines.push('| Bileşen | Skor | Katkı |');
          lines.push('|---------|------|-------|');
          for (const [key, val] of Object.entries(breakdown)) {
            const v = val as Record<string, unknown>;
            lines.push(`| ${key} | ${v.score} | %${((v.contribution as number || 0) * 100).toFixed(0)} |`);
          }
          lines.push('');
        }
        sections.push({ title: 'Şirket Özeti', content: `Elite Score: ${eliteScore.eliteScore}`, level: 2 });
      }

      const technicalSummary = analysis.technicalSummary as Record<string, unknown> | undefined;
      if (technicalSummary) {
        lines.push('## 2. Teknik Analiz');
        lines.push('');
        lines.push(`**Değerlendirme:** ${technicalSummary.overallOpinion || 'N/A'}`);
        lines.push(`**Özet:** ${technicalSummary.summary || 'N/A'}`);
        lines.push('');

        if (technicalSummary.strengths) {
          lines.push('**Güçlü Yönler:**');
          for (const s of technicalSummary.strengths as string[]) {
            lines.push(`   ✅ ${s}`);
          }
          lines.push('');
        }

        if (technicalSummary.weaknesses) {
          lines.push('**Zayıf Yönler:**');
          for (const w of technicalSummary.weaknesses as string[]) {
            lines.push(`   ⚠️ ${w}`);
          }
          lines.push('');
        }

        if (technicalSummary.risks) {
          lines.push('**Riskler:**');
          for (const r of technicalSummary.risks as string[]) {
            lines.push(`   🔴 ${r}`);
          }
          lines.push('');
        }

        if (technicalSummary.recommendations) {
          lines.push('**Öneriler:**');
          for (const r of technicalSummary.recommendations as string[]) {
            lines.push(`   💡 ${r}`);
          }
          lines.push('');
        }

        sections.push({ title: 'Teknik Analiz', content: technicalSummary.overallOpinion as string || '', level: 2 });
      }

      const financialSummary = analysis.financialSummary as Record<string, unknown> | undefined;
      if (financialSummary) {
        lines.push('## 3. Finansal Analiz');
        lines.push('');
        lines.push(`**Değerlendirme:** ${financialSummary.overallOpinion || 'N/A'}`);
        lines.push(`**Özet:** ${financialSummary.summary || 'N/A'}`);
        lines.push('');

        if (financialSummary.strengths) {
          lines.push('**Güçlü Yönler:**');
          for (const s of financialSummary.strengths as string[]) {
            lines.push(`   ✅ ${s}`);
          }
          lines.push('');
        }

        if (financialSummary.weaknesses) {
          lines.push('**Zayıf Yönler:**');
          for (const w of financialSummary.weaknesses as string[]) {
            lines.push(`   ⚠️ ${w}`);
          }
          lines.push('');
        }

        if (financialSummary.risks) {
          lines.push('**Riskler:**');
          for (const r of financialSummary.risks as string[]) {
            lines.push(`   🔴 ${r}`);
          }
          lines.push('');
        }

        sections.push({ title: 'Finansal Analiz', content: financialSummary.overallOpinion as string || '', level: 2 });
      }

      const opportunity = analysis.opportunity as Record<string, unknown> | undefined;
      if (opportunity) {
        lines.push('## 4. Fırsat Değerlendirmesi');
        lines.push('');
        lines.push(`**Fırsat Skoru:** ${opportunity.opportunityScore}`);
        lines.push(`**Seviye:** ${opportunity.opportunityLevel}`);
        lines.push(`**Erken Fırsat:** ${opportunity.earlyOpportunity ? 'Evet' : 'Hayır'}`);
        lines.push(`**Güven:** %${((opportunity.confidence as number || 0) * 100).toFixed(0)}`);
        lines.push('');

        if (opportunity.strengths) {
          lines.push('**Güçlü Yönler:**');
          for (const s of opportunity.strengths as string[]) {
            lines.push(`   ✅ ${s}`);
          }
          lines.push('');
        }

        if (opportunity.reasons) {
          lines.push('**Nedenler:**');
          for (const r of opportunity.reasons as string[]) {
            lines.push(`   • ${r}`);
          }
          lines.push('');
        }

        if (opportunity.riskFactors) {
          lines.push('**Risk Faktörleri:**');
          for (const r of opportunity.riskFactors as string[]) {
            lines.push(`   ⚠️ ${r}`);
          }
          lines.push('');
        }

        sections.push({ title: 'Fırsat Değerlendirmesi', content: `Fırsat Skoru: ${opportunity.opportunityScore}`, level: 2 });
      }

      const confluence = analysis.confluence as Record<string, unknown> | undefined;
      if (confluence) {
        lines.push('## 5. Uyum (Confluence) Analizi');
        lines.push('');
        lines.push(`**Uyum Skoru:** ${confluence.confluenceScore}`);
        lines.push(`**Uyum Seviyesi:** ${confluence.agreement}`);
        lines.push(`**Güven:** %${((confluence.confidence as number || 0) * 100).toFixed(0)}`);
        lines.push('');

        if (confluence.financialAlignment) {
          const fa = confluence.financialAlignment as Record<string, unknown>;
          lines.push(`**Finansal Uyum:** ${fa.direction} (skor: ${fa.score})`);
        }
        if (confluence.technicalAlignment) {
          const ta = confluence.technicalAlignment as Record<string, unknown>;
          lines.push(`**Teknik Uyum:** ${ta.direction} (skor: ${ta.score})`);
        }
        lines.push('');

        sections.push({ title: 'Uyum (Confluence) Analizi', content: `Uyum Skoru: ${confluence.confluenceScore}`, level: 2 });
      }
    }

    if (macroData) {
      lines.push('## 6. Makro Ekonomik Görünüm');
      lines.push('');

      const indicators = macroData.indicators as Record<string, unknown> | undefined;
      if (indicators) {
        lines.push('**Temel Göstergeler:**');
        lines.push('');
        for (const [key, val] of Object.entries(indicators).slice(0, 15)) {
          lines.push(`   • **${key}:** ${typeof val === 'number' ? val.toFixed(2) : val}`);
        }
        lines.push('');
      }
      sections.push({ title: 'Makro Ekonomik Görünüm', content: 'Makro veriler', level: 2 });
    }

    lines.push('---');
    lines.push('');
    lines.push('## 7. Değerlendirme ve Öneri');
    lines.push('');

    if (analysis) {
      const es = analysis.eliteScore as Record<string, unknown> | undefined;
      if (es) {
        const rating = es.rating as string || '';
        const score = es.eliteScore as number || 0;

        if (score >= 80) {
          lines.push(`**${symbol}** için görünüm **OLUMLU**. Elite Score ${score} ile ${rating} seviyesindedir.`);
          if (rating === 'AAA' || rating === 'AA') {
            lines.push('Bu seviyedeki hisseler genellikle düşük riskli ve yüksek potansiyelli olarak değerlendirilir.');
          }
        } else if (score >= 60) {
          lines.push(`**${symbol}** için görünüm **NÖTR**. Elite Score ${score} ile ${rating} seviyesindedir.`);
          lines.push('Detaylı analiz yapılması önerilir.');
        } else {
          lines.push(`**${symbol}** için görünüm **OLUMSUZ**. Elite Score ${score} ile ${rating} seviyesindedir.`);
          lines.push('Yatırım yapmadan önce risklerin dikkatlice değerlendirilmesi önerilir.');
        }
      }
    } else {
      lines.push(`**${symbol}** için analiz verisi bulunamadı. Lütfen daha sonra tekrar deneyin.`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*Rapor ${new Date(timestamp).toLocaleString('tr-TR')} tarihinde BIST Elite AI tarafından otomatik oluşturulmuştur.*`);
    lines.push('*Bu rapor yatırım tavsiyesi değildir, yalnızca bilgilendirme amaçlıdır.*');

    sections.push({ title: 'Değerlendirme ve Öneri', content: `Genel değerlendirme`, level: 2 });

    return {
      title: `${symbol} — Yatırım Raporu`,
      generatedAt: timestamp,
      symbol,
      sections,
      markdown: lines.join('\n'),
    };
  }
}
