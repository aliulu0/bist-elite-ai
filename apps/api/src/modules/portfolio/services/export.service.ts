import { Injectable } from '@nestjs/common';
import { PortfolioReport, Portfolio, Position, Transaction } from '../types/portfolio.types';

@Injectable()
export class ExportService {
  toCsv(report: PortfolioReport | Position[] | Transaction[]): string {
    if (Array.isArray(report)) {
      if (report.length === 0) return '';
      const headers = Object.keys(report[0] as unknown as Record<string, unknown>);
      const rows = report.map((item) =>
        headers.map((h) => {
          const val = (item as unknown as Record<string, unknown>)[h];
          return typeof val === 'string' && (val.includes(',') || val.includes('"'))
            ? `"${val.replace(/"/g, '""')}"`
            : String(val ?? '');
        }).join(','),
      );
      return [headers.join(','), ...rows].join('\n');
    }

    const rows: string[][] = [];
    rows.push(['Metric', 'Value']);
    rows.push(['Total Value', String(report.summary.totalValue)]);
    rows.push(['Cash', String(report.summary.cash)]);
    rows.push(['Total Profit/Loss', String(report.summary.totalProfitLoss)]);
    rows.push(['Total Return %', String(report.summary.totalReturn)]);
    rows.push(['Position Count', String(report.summary.positionCount)]);
    rows.push(['Portfolio Risk', String(report.risk.portfolioRisk)]);
    rows.push(['Max Drawdown', String(report.risk.maxDrawdown)]);
    rows.push(['Volatility', String(report.risk.volatility)]);
    rows.push(['Generated At', report.generatedAt]);

    return rows.map((r) => r.join(',')).join('\n');
  }

  toJson(data: PortfolioReport | Portfolio | Position[] | Transaction[]): string {
    return JSON.stringify(data, null, 2);
  }

  toExcel(data: PortfolioReport | Position[] | Transaction[]): string {
    const csv = this.toCsv(data);
    const header = 'sep=,\n';
    return header + csv;
  }
}
