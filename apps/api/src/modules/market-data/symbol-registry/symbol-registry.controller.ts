import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/auth/decorators';
import { SymbolRegistryService } from './symbol-registry.service';

export interface SymbolLookupEntry {
  ticker: string;
  company: string;
  sector: string;
  isin: string | null;
  active: boolean;
}

export interface SymbolLookupResponse {
  success: boolean;
  data: SymbolLookupEntry[];
  total: number;
  sectors: string[];
  timestamp: string;
}

@ApiTags('Symbol Registry')
@Controller('symbols')
export class SymbolRegistryController {
  constructor(private readonly registry: SymbolRegistryService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Sembol kayıt listesi (SymbolRegistry) — arama ve filtre menüleri için',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Ticker veya şirket adı araması',
  })
  @ApiQuery({ name: 'sector', required: false, type: String })
  @ApiQuery({
    name: 'active',
    required: false,
    type: String,
    description: 'true (varsayılan) veya all',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Query('q') q?: string,
    @Query('sector') sector?: string,
    @Query('active') active?: string,
    @Query('limit') limit?: string,
  ): Promise<SymbolLookupResponse> {
    const query = q?.trim().toUpperCase();
    const sectorFilter = sector?.trim();
    const includeInactive = active?.toLowerCase() === 'all';
    const max = limit ? Number(limit) : undefined;

    const symbols = includeInactive ? this.registry.getSymbols() : this.registry.getActiveSymbols();

    const filtered = symbols.filter((s) => {
      if (query) {
        const matchesTicker = s.canonicalTicker.toUpperCase().includes(query);
        const matchesCompany = s.companyName.toUpperCase().includes(query);
        if (!matchesTicker && !matchesCompany) return false;
      }
      if (sectorFilter) {
        if (s.sector.toUpperCase() !== sectorFilter.toUpperCase()) return false;
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => a.canonicalTicker.localeCompare(b.canonicalTicker));
    const data = (max ? sorted.slice(0, max) : sorted).map((s) => ({
      ticker: s.canonicalTicker,
      company: s.companyName,
      sector: s.sector,
      isin: s.isin,
      active: s.active,
    }));

    const sectors = Array.from(new Set(this.registry.getSymbols().map((s) => s.sector))).sort();

    return {
      success: true,
      data,
      total: filtered.length,
      sectors,
      timestamp: new Date().toISOString(),
    };
  }
}
