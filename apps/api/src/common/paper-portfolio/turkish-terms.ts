import { PaperPortfolioType, PositionStatus, MarketRegime } from './types';

export const PORTFOLIO_TYPE_TURKISH: Record<PaperPortfolioType, string> = {
  [PaperPortfolioType.DEFAULT]: 'Varsayılan Portföy',
  [PaperPortfolioType.GROWTH]: 'Büyüme Portföyü',
  [PaperPortfolioType.CONSERVATIVE]: 'Muhafazakar Portföy',
  [PaperPortfolioType.BALANCED]: 'Dengeli Portföy',
  [PaperPortfolioType.CUSTOM]: 'Özel Portföy',
};

export const POSITION_STATUS_TURKISH: Record<PositionStatus, string> = {
  [PositionStatus.PENDING]: 'Beklemede',
  [PositionStatus.OPEN]: 'Açık',
  [PositionStatus.CLOSED]: 'Kapalı',
  [PositionStatus.CANCELLED]: 'İptal',
};

export const MARKET_REGIME_TURKISH: Record<MarketRegime, string> = {
  [MarketRegime.BULL]: 'Yükseliş Piyasası',
  [MarketRegime.BEAR]: 'Düşüş Piyasası',
  [MarketRegime.SIDEWAYS]: 'Yatay Piyasa',
  [MarketRegime.HIGH_VOLATILITY]: 'Yüksek Volatilite',
  [MarketRegime.LOW_VOLATILITY]: 'Düşük Volatilite',
};

export function generatePortfolioSummaryTurkish(
  name: string,
  totalValue: number,
  cashBalance: number,
  investedValue: number,
  totalReturn: number,
  totalReturnPercent: number,
  openCount: number,
  closedCount: number,
  unrealizedPnl: number,
  realizedPnl: number,
): string {
  const returnSign = totalReturn >= 0 ? '+' : '';
  let report = `## Portföy Özeti: ${name}\n\n`;
  report += `| Metrik | Değer |\n|--------|-------|\n`;
  report += `| Toplam Değer | ₺${totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} |\n`;
  report += `| Nakit Bakiye | ₺${cashBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} |\n`;
  report += `| Yatırım Değeri | ₺${investedValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} |\n`;
  report += `| Toplam Getiri | ${returnSign}₺${totalReturn.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (${returnSign}${totalReturnPercent.toFixed(2)}%) |\n`;
  report += `| Açık Pozisyon | ${openCount} |\n`;
  report += `| Kapalı Pozisyon | ${closedCount} |\n`;
  report += `| Gerçekleşmemiş K/Z | ₺${unrealizedPnl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} |\n`;
  report += `| Gerçekleşmiş K/Z | ₺${realizedPnl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} |\n`;
  return report;
}

export function generatePerformanceReportTurkish(
  totalReturn: number,
  annualizedReturn: number,
  maxDrawdown: number,
  sharpeRatio: number,
  winRate: number,
  profitFactor: number,
  avgHoldingPeriod: number,
): string {
  const returnSign = totalReturn >= 0 ? '+' : '';
  let report = `## Performans Raporu\n\n`;
  report += `| Metrik | Değer |\n|--------|-------|\n`;
  report += `| Toplam Getiri | ${returnSign}${totalReturn.toFixed(2)}% |\n`;
  report += `| Yıllık Getiri | ${returnSign}${annualizedReturn.toFixed(2)}% |\n`;
  report += `| Maksimum Drawdown | -${maxDrawdown.toFixed(2)}% |\n`;
  report += `| Sharpe Oranı | ${sharpeRatio.toFixed(2)} |\n`;
  report += `| Kazanma Oranı | %${winRate.toFixed(1)} |\n`;
  report += `| Kâr Faktörü | ${profitFactor.toFixed(2)} |\n`;
  report += `| Ortalama Tutma Süresi | ${avgHoldingPeriod.toFixed(0)} gün |\n`;
  return report;
}

export function generateRiskReportTurkish(
  riskScore: number,
  cashAllocation: number,
  maxConcentration: number,
  drawdown: number,
  withinLimit: boolean,
  riskFactors: Array<{ type: string; severity: string; description: string }>,
): string {
  let report = `## Risk Raporu\n\n`;
  report += `| Metrik | Değer |\n|--------|-------|\n`;
  report += `| Risk Skoru | ${riskScore.toFixed(1)}/100 |\n`;
  report += `| Nakit Oranı | %${(cashAllocation * 100).toFixed(1)} |\n`;
  report += `| Maksimum Yoğunlaşma | %${(maxConcentration * 100).toFixed(1)} |\n`;
  report += `| Mevcut Drawdown | -${drawdown.toFixed(2)}% |\n`;
  report += `| Drawdown Limiti | ${withinLimit ? 'Uygun' : 'Aşıldı'} |\n`;

  if (riskFactors.length > 0) {
    report += `\n### Risk Faktörleri\n`;
    for (const factor of riskFactors) {
      report += `- **${factor.type}** (${factor.severity}): ${factor.description}\n`;
    }
  }

  return report;
}

export const TRADE_EXECUTED_TURKISH = 'İşlem Gerçekleştirildi';
export const PORTFOLIO_CREATED_TURKISH = 'Portföy Oluşturuldu';
export const POSITION_CLOSED_TURKISH = 'Pozisyon Kapatıldı';
export const INSUFFICIENT_CASH_TURKISH = 'Yetersiz Nakit';
export const POSITION_LIMIT_EXCEEDED_TURKISH = 'Pozisyon Limiti Aşıldı';
export const RISK_CHECK_FAILED_TURKISH = 'Risk Kontrolü Başarısız';

export function formatCurrency(value: number): string {
  return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercentage(value: number): string {
  return `%${value.toFixed(2)}`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function generateReportHeader(title: string): string {
  const line = '═'.repeat(title.length + 4);
  return `${line}\n  ${title}\n${line}`;
}

export function generateReportFooter(): string {
  return '══════════════════════════════════════════════════════════';
}
