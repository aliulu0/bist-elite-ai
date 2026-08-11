import { Injectable } from '@nestjs/common';
import { ValidationWarning } from './aggregation.types';

@Injectable()
export class DataValidator {
  validateCompany(data: Record<string, unknown>, provider: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!data.symbol || typeof data.symbol !== 'string') {
      warnings.push({ field: 'symbol', message: 'Missing or invalid symbol', severity: 'error', provider });
    }
    if (!data.name || typeof data.name !== 'string') {
      warnings.push({ field: 'name', message: 'Missing or invalid company name', severity: 'warning', provider });
    }
    if (typeof data.marketCap === 'number' && data.marketCap < 0) {
      warnings.push({ field: 'marketCap', message: 'Negative market cap', severity: 'error', provider });
    }
    if (data.sector && typeof data.sector === 'string' && data.sector === 'Unknown') {
      warnings.push({ field: 'sector', message: 'Sector is Unknown', severity: 'info', provider });
    }
    if (data.lastUpdated) {
      const date = new Date(data.lastUpdated as string);
      if (Number.isNaN(date.getTime())) {
        warnings.push({ field: 'lastUpdated', message: 'Invalid timestamp', severity: 'error', provider });
      } else if (date > new Date()) {
        warnings.push({ field: 'lastUpdated', message: 'Timestamp is in the future', severity: 'warning', provider });
      }
    }

    return warnings;
  }

  validateFinancialStatement(data: Record<string, unknown>, provider: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!data.symbol || typeof data.symbol !== 'string') {
      warnings.push({ field: 'symbol', message: 'Missing or invalid symbol', severity: 'error', provider });
    }
    if (typeof data.revenue === 'number' && data.revenue < 0) {
      warnings.push({ field: 'revenue', message: 'Negative revenue', severity: 'error', provider });
    }
    if (typeof data.netIncome === 'number' && typeof data.revenue === 'number') {
      if (data.netIncome as number > (data.revenue as number) * 2) {
        warnings.push({ field: 'netIncome', message: 'Net income exceeds 2x revenue', severity: 'warning', provider });
      }
    }
    if (data.lastUpdated) {
      const date = new Date(data.lastUpdated as string);
      if (Number.isNaN(date.getTime())) {
        warnings.push({ field: 'lastUpdated', message: 'Invalid timestamp', severity: 'error', provider });
      }
    }

    return warnings;
  }

  validateBalanceSheet(data: Record<string, unknown>, provider: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!data.symbol || typeof data.symbol !== 'string') {
      warnings.push({ field: 'symbol', message: 'Missing or invalid symbol', severity: 'error', provider });
    }
    if (typeof data.totalAssets === 'number' && data.totalAssets < 0) {
      warnings.push({ field: 'totalAssets', message: 'Negative total assets', severity: 'error', provider });
    }
    if (typeof data.equity === 'number' && typeof data.totalAssets === 'number') {
      if (Math.abs(data.equity as number) > Math.abs(data.totalAssets as number) * 2) {
        warnings.push({ field: 'equity', message: 'Equity exceeds 2x total assets', severity: 'warning', provider });
      }
    }

    return warnings;
  }

  validateIncomeStatement(data: Record<string, unknown>, provider: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!data.symbol || typeof data.symbol !== 'string') {
      warnings.push({ field: 'symbol', message: 'Missing or invalid symbol', severity: 'error', provider });
    }
    if (typeof data.revenue === 'number' && data.revenue < 0) {
      warnings.push({ field: 'revenue', message: 'Negative revenue', severity: 'error', provider });
    }
    if (typeof data.netProfit === 'number' && typeof data.revenue === 'number') {
      if (data.netProfit as number > (data.revenue as number) * 2) {
        warnings.push({ field: 'netProfit', message: 'Net profit exceeds 2x revenue', severity: 'warning', provider });
      }
    }

    return warnings;
  }

  validateCashFlow(data: Record<string, unknown>, provider: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!data.symbol || typeof data.symbol !== 'string') {
      warnings.push({ field: 'symbol', message: 'Missing or invalid symbol', severity: 'error', provider });
    }

    return warnings;
  }

  validateSector(data: Record<string, unknown>, provider: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!data.symbol || typeof data.symbol !== 'string') {
      warnings.push({ field: 'symbol', message: 'Missing or invalid symbol', severity: 'error', provider });
    }
    if (!data.sector || typeof data.sector !== 'string') {
      warnings.push({ field: 'sector', message: 'Missing or invalid sector', severity: 'error', provider });
    } else if (data.sector === 'Unknown') {
      warnings.push({ field: 'sector', message: 'Sector is Unknown', severity: 'info', provider });
    }

    return warnings;
  }

  validateDisclosure(data: Record<string, unknown>, provider: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!data.title || typeof data.title !== 'string') {
      warnings.push({ field: 'title', message: 'Missing or invalid disclosure title', severity: 'warning', provider });
    }
    if (!data.date || typeof data.date !== 'string') {
      warnings.push({ field: 'date', message: 'Missing or invalid disclosure date', severity: 'warning', provider });
    } else {
      const date = new Date(data.date as string);
      if (Number.isNaN(date.getTime())) {
        warnings.push({ field: 'date', message: 'Invalid disclosure date', severity: 'error', provider });
      }
    }

    return warnings;
  }

  deduplicateDisclosures(disclosures: Array<{ title: string; date: string; source: string }>): Array<{ title: string; date: string; source: string }> {
    const seen = new Set<string>();
    const unique: Array<{ title: string; date: string; source: string }> = [];

    for (const d of disclosures) {
      const key = `${d.title}:${d.date}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(d);
      }
    }

    return unique;
  }

  deduplicateFinancialStatements(statements: Array<{ symbol: string; period: string; source: string }>): Array<{ symbol: string; period: string; source: string }> {
    const seen = new Set<string>();
    const unique: Array<{ symbol: string; period: string; source: string }> = [];

    for (const s of statements) {
      const key = `${s.symbol}:${s.period}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(s);
      }
    }

    return unique;
  }
}
