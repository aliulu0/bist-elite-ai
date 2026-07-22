import { Injectable } from '@nestjs/common';
import { PortfolioState, PerformanceReport, RiskAssessment, PositionStatus, PositionDetail } from './types';
import { formatCurrency, formatPercentage, formatNumber, generateReportHeader, generateReportFooter } from './turkish-terms';

@Injectable()
export class PaperReportGeneratorService {
  generateSummaryReport(
    portfolio: PortfolioState,
    performance: PerformanceReport,
    risk: RiskAssessment,
  ): string {
    const sections: string[] = [];

    sections.push(generateReportHeader('KAĞIT PORTFÖY ÖZET RAPORU'));
    sections.push('');

    sections.push('── GENEL BİLGİLER ──');
    sections.push(`  Portföy Adı: ${portfolio.name}`);
    sections.push(`  Başlangıç Sermayesi: ${formatCurrency(portfolio.initialCapital)}`);
    sections.push(`  Güncel Değer: ${formatCurrency(portfolio.cashBalance + this.getInvestedValue(portfolio))}`);
    sections.push(`  Nakit Bakiye: ${formatCurrency(portfolio.cashBalance)}`);
    sections.push('');

    sections.push('── GETİRİ ANALİZİ ──');
    sections.push(`  Toplam Getiri: ${formatPercentage(performance.totalReturn)}`);
    sections.push(`  Gerçekleşen Getiri: ${formatPercentage(performance.realizedReturn)}`);
    sections.push(`  Gerçekleşmemiş Getiri: ${formatPercentage(performance.unrealizedReturn)}`);
    sections.push(`  Yıllıklandırılmış Getiri: ${formatPercentage(performance.annualizedReturn)}`);
    sections.push('');

    sections.push('── RİSK METRİKLERİ ──');
    sections.push(`  Maksimum Drawdown: ${formatPercentage(performance.maxDrawdown)}`);
    sections.push(`  Güncel Drawdown: ${formatPercentage(performance.currentDrawdown)}`);
    sections.push(`  Portföy Volatilitesi: ${formatPercentage(performance.portfolioVolatility)}`);
    sections.push(`  Sharpe Oranı: ${formatNumber(performance.sharpeRatio, 2)}`);
    sections.push('');

    sections.push('── İŞLEM ANALİZİ ──');
    sections.push(`  Kazanma Oranı: ${formatPercentage(performance.winRate * 100)}`);
    sections.push(`  Kâr Faktörü: ${formatNumber(performance.profitFactor, 2)}`);
    sections.push(`  Ortalama Kazanan İşlem: ${formatCurrency(performance.avgWinningTrade)}`);
    sections.push(`  Ortalama Kaybeden İşlem: ${formatCurrency(performance.avgLosingTrade)}`);
    sections.push(`  Ortalama Pozisyon Süresi: ${formatNumber(performance.avgHoldingPeriod, 1)} gün`);
    sections.push('');

    sections.push('── RİSK DEĞERLENDİRMESİ ──');
    sections.push(`  Risk Skoru: ${formatNumber(risk.overallRiskScore, 1)}/100`);
    sections.push(`  Nakit Oranı: ${formatPercentage(risk.cashAllocation * 100)}`);
    sections.push(`  Pozisyon Sayısı: ${risk.positionCount}`);
    sections.push(`  Drawdown Limiti İçerisinde: ${risk.withinDrawdownLimit ? 'Evet' : 'Hayır'}`);

    if (risk.riskFactors.length > 0) {
      sections.push('');
      sections.push('  Risk Faktörleri:');
      risk.riskFactors.forEach(f => {
        sections.push(`    • [${f.severity}] ${f.description}`);
      });
    }

    sections.push('');
    sections.push(generateReportFooter());

    return sections.join('\n');
  }

  generatePositionReport(portfolio: PortfolioState): string {
    const sections: string[] = [];

    sections.push(generateReportHeader('POZİSYON DETAY RAPORU'));
    sections.push('');

    const openPositions: PositionDetail[] = [];
    const closedPositions: PositionDetail[] = [];

    portfolio.positions.forEach(p => {
      const detail: PositionDetail = {
        stockSymbol: p.stockSymbol,
        stockName: p.stockName,
        status: p.status,
        quantity: p.quantity,
        avgCost: p.avgCost,
        currentPrice: p.currentPrice,
        marketValue: p.quantity * p.currentPrice,
        unrealizedPnl: p.unrealizedPnl,
        unrealizedPnlPercent: p.avgCost > 0 ? ((p.currentPrice - p.avgCost) / p.avgCost) * 100 : 0,
        holdingPeriodDays: p.holdingPeriodDays,
        entryEliteScore: p.entryEliteScore,
        entryConfidence: p.entryConfidence,
        entryConsensusScore: p.entryConsensusScore,
        strategyUsed: p.strategyUsed,
        marketRegime: p.marketRegime,
        sector: p.sector,
      };
      if (p.status === PositionStatus.OPEN) {
        openPositions.push(detail);
      } else {
        closedPositions.push(detail);
      }
    });

    if (openPositions.length > 0) {
      sections.push('── AÇIK POZİSYONLAR ──');
      openPositions.forEach(pos => {
        sections.push(`  ${pos.stockSymbol} (${pos.stockName})`);
        sections.push(`    Miktar: ${pos.quantity} | Maliyet: ${formatCurrency(pos.avgCost)} | Güncel: ${formatCurrency(pos.currentPrice)}`);
        sections.push(`    Piyasa Değeri: ${formatCurrency(pos.marketValue)}`);
        sections.push(`    Gerçekleşmemiş K/Z: ${formatCurrency(pos.unrealizedPnl)} (${formatPercentage(pos.unrealizedPnlPercent)})`);
        sections.push(`    Pozisyon Süresi: ${pos.holdingPeriodDays} gün`);
        sections.push('');
      });
    }

    if (closedPositions.length > 0) {
      sections.push('── KAPANMIŞ POZİSYONLAR ──');
      closedPositions.forEach(pos => {
        sections.push(`  ${pos.stockSymbol} (${pos.stockName})`);
        sections.push(`    Miktar: ${pos.quantity} | Giriş: ${formatCurrency(pos.avgCost)} | Çıkış: ${formatCurrency(pos.currentPrice)}`);
        sections.push(`    Süre: ${pos.holdingPeriodDays} gün`);
        sections.push('');
      });
    }

    if (openPositions.length === 0 && closedPositions.length === 0) {
      sections.push('  Henüz pozisyon bulunmuyor.');
    }

    sections.push(generateReportFooter());

    return sections.join('\n');
  }

  generateRiskReport(risk: RiskAssessment): string {
    const sections: string[] = [];

    sections.push(generateReportHeader('RİSK ANALİZ RAPORU'));
    sections.push('');

    sections.push(`  Portföy ID: ${risk.portfolioId}`);
    sections.push(`  Risk Skoru: ${formatNumber(risk.overallRiskScore, 1)}/100`);
    sections.push(`  Nakit Oranı: ${formatPercentage(risk.cashAllocation * 100)}`);
    sections.push(`  Maksimum Yoğunlaşma: ${formatPercentage(risk.maxConcentration * 100)}`);
    sections.push(`  Drawdown: ${formatPercentage(risk.drawdown)}`);
    sections.push(`  Drawdown Limiti: ${risk.withinDrawdownLimit ? 'İçerisinde' : 'Aşıldı'}`);
    sections.push(`  Açık Pozisyon: ${risk.positionCount}`);
    sections.push('');

    if (Object.keys(risk.sectorExposure).length > 0) {
      sections.push('── SEKTÖR MARUZİYETİ ──');
      Object.entries(risk.sectorExposure).forEach(([sector, exposure]) => {
        sections.push(`  ${sector}: ${formatPercentage(exposure * 100)}`);
      });
      sections.push('');
    }

    if (risk.riskFactors.length > 0) {
      sections.push('── RİSK FAKTÖRLERİ ──');
      risk.riskFactors.forEach(f => {
        sections.push(`  [${f.severity}] ${f.description}`);
      });
    } else {
      sections.push('  Belirgin risk faktörü tespit edilmedi.');
    }

    sections.push('');
    sections.push(generateReportFooter());

    return sections.join('\n');
  }

  private getInvestedValue(portfolio: PortfolioState): number {
    let invested = 0;
    portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        invested += p.quantity * p.currentPrice;
      }
    });
    return invested;
  }
}
