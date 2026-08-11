import { Injectable, Logger } from '@nestjs/common';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';
import { BistMasterRegistryEntry, BistAssetType } from '../market-data/symbol-registry/symbol-registry.types';
import { ScannerInstrument, ScannerFilterOptions } from './elite-scanner.types';

@Injectable()
export class ScannerRegistry {
  private readonly logger = new Logger(ScannerRegistry.name);

  constructor(private readonly symbolRegistry: SymbolRegistryService) {}

  getInstruments(filter?: Partial<ScannerFilterOptions>): ScannerInstrument[] {
    const entries = this.symbolRegistry.getMasterRegistry();
    const activeOnly = filter?.activeOnly ?? true;

    const filtered = entries.filter((entry) => {
      if (activeOnly && entry.status !== 'active') return false;
      if (filter?.sector && entry.sector !== filter.sector) return false;
      if (filter?.assetType && entry.assetType !== filter.assetType) return false;
      return true;
    });

    const instruments = filtered.map((entry) => this.toInstrument(entry));
    if (filter?.limit && filter.limit > 0) {
      return instruments.slice(0, filter.limit);
    }
    return instruments;
  }

  getCount(): number {
    return this.symbolRegistry.getMasterRegistry().length;
  }

  getActiveCount(): number {
    return this.symbolRegistry
      .getMasterRegistry()
      .filter((entry) => entry.status === 'active').length;
  }

  getSectors(): string[] {
    const sectors = new Set<string>();
    for (const entry of this.symbolRegistry.getMasterRegistry()) {
      if (entry.sector) sectors.add(entry.sector);
    }
    return [...sectors].sort();
  }

  getAssetTypes(): BistAssetType[] {
    const types = new Set<BistAssetType>();
    for (const entry of this.symbolRegistry.getMasterRegistry()) {
      types.add(entry.assetType);
    }
    return [...types];
  }

  private toInstrument(entry: BistMasterRegistryEntry): ScannerInstrument {
    return {
      ticker: entry.ticker,
      yahooTicker: entry.yahooTicker ?? entry.ticker,
      company: entry.companyName ?? entry.turkishName ?? entry.ticker,
      sector: entry.sector ?? null,
      market: entry.market,
      assetType: entry.assetType,
      currency: entry.currency,
      isin: entry.isin,
    };
  }
}
