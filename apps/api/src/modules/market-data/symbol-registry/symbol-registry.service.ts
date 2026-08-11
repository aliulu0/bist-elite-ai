import { Injectable } from '@nestjs/common';
import { BistSymbolEntry, BistProviderName, BistMasterRegistryEntry } from './symbol-registry.types';
import { BIST_SYMBOLS, BIST_SYMBOL_MAP, BIST_ACTIVE_SYMBOLS } from './bist-symbols.data';
import {
  BIST_MASTER_REGISTRY,
  BIST_MASTER_REGISTRY_MAP,
} from './bist-master-registry.data';

export interface MasterRegistryStats {
  totalInstruments: number;
  totalActive: number;
  totalInactive: number;
  byAssetType: Record<string, number>;
  yahooCoverage: number;
  yahooCoveragePct: number;
  missingYahoo: string[];
}

@Injectable()
export class SymbolRegistryService {
  getSymbols(): BistSymbolEntry[] {
    return BIST_SYMBOLS;
  }

  getSymbol(ticker: string): BistSymbolEntry | undefined {
    return BIST_SYMBOL_MAP.get(ticker.toUpperCase());
  }

  getActiveSymbols(): BistSymbolEntry[] {
    return BIST_ACTIVE_SYMBOLS.map((ticker) => BIST_SYMBOL_MAP.get(ticker)!);
  }

  isActive(ticker: string): boolean {
    return BIST_ACTIVE_SYMBOLS.includes(ticker.toUpperCase());
  }

  getProviderTicker(ticker: string, provider: BistProviderName): string | undefined {
    const entry = BIST_SYMBOL_MAP.get(ticker.toUpperCase());
    return entry?.providers?.[provider];
  }

  getCanonicalTicker(provider: BistProviderName, providerTicker: string): string | undefined {
    const normalized = providerTicker.toUpperCase().split('.')[0];
    for (const entry of BIST_SYMBOLS) {
      if (entry.providers[provider]?.toUpperCase() === providerTicker.toUpperCase()) {
        return entry.canonicalTicker;
      }
    }
    return BIST_SYMBOL_MAP.has(normalized) ? normalized : undefined;
  }

  getSector(ticker: string): string | undefined {
    return BIST_SYMBOL_MAP.get(ticker.toUpperCase())?.sector;
  }

  getIsin(ticker: string): string | null | undefined {
    return BIST_SYMBOL_MAP.get(ticker.toUpperCase())?.isin;
  }

  getCompanyName(ticker: string): string | undefined {
    return BIST_SYMBOL_MAP.get(ticker.toUpperCase())?.companyName;
  }

  getSymbolsBySector(sector: string): BistSymbolEntry[] {
    const target = sector.toUpperCase();
    return BIST_SYMBOLS.filter(
      (entry) => entry.sector.toUpperCase() === target,
    );
  }

  getCoverageForProvider(provider: BistProviderName): number {
    return BIST_ACTIVE_SYMBOLS.filter((ticker) => !!this.getProviderTicker(ticker, provider)).length;
  }

  getMasterRegistry(): BistMasterRegistryEntry[] {
    return BIST_MASTER_REGISTRY;
  }

  getMasterRegistryEntry(ticker: string): BistMasterRegistryEntry | undefined {
    return BIST_MASTER_REGISTRY_MAP.get(ticker.toUpperCase());
  }

  getMasterRegistryStats(): MasterRegistryStats {
    const totalInstruments = BIST_MASTER_REGISTRY.length;
    const totalActive = BIST_MASTER_REGISTRY.filter((e) => e.status === 'active').length;
    const totalInactive = BIST_MASTER_REGISTRY.filter((e) => e.status === 'inactive').length;
    const byAssetType: Record<string, number> = {};
    for (const e of BIST_MASTER_REGISTRY) {
      byAssetType[e.assetType] = (byAssetType[e.assetType] ?? 0) + 1;
    }
    const yahooCovered = BIST_MASTER_REGISTRY.filter((e) => e.dataSources.includes('yahoo'));
    const yahooCoverage = yahooCovered.length;
    const yahooCoveragePct = Math.round((yahooCoverage / totalInstruments) * 1000) / 10;
    const missingYahoo = BIST_MASTER_REGISTRY.filter((e) => e.status === 'active' && !e.dataSources.includes('yahoo')).map((e) => e.ticker);
    return {
      totalInstruments,
      totalActive,
      totalInactive,
      byAssetType,
      yahooCoverage,
      yahooCoveragePct,
      missingYahoo,
    };
  }
}
