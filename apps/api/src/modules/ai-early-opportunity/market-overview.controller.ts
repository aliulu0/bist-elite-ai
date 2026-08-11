import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { LatestPriceIncrementalService } from '../market-data/incremental/latest-price-incremental.service';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';

interface MarketOverviewResponse {
  bist100: { value: number; change: number; changePercent: number };
  sectorHeatmap: { sector: string; changePercent: number; stocks: number }[];
  topGainers: { ticker: string; name: string; changePercent: number; price: number }[];
  topLosers: { ticker: string; name: string; changePercent: number; price: number }[];
  volumeLeaders: { ticker: string; name: string; volume: number; changePercent: number }[];
  smartMoneyLeaders: { ticker: string; name: string; smartMoneyScore: number; accumulation: string }[];
  catalystLeaders: { ticker: string; name: string; catalystScore: number; verified: boolean }[];
}

@ApiTags('Market Overview')
@Controller('market')
export class MarketOverviewController {
  constructor(
    private readonly marketData: MarketDataOrchestrator,
    private readonly latestPrice: LatestPriceIncrementalService,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  @Get('overview')
  @Public()
  @ApiOperation({ summary: 'Get market overview with BIST100, sector heatmap, top gainers/losers, volume leaders' })
  async getOverview(): Promise<MarketOverviewResponse> {
    const symbols = this.symbolRegistry.getSymbols()
      .filter((s: any) => s.isActive)
      .slice(0, 100);

    const symbolTickers = symbols.map((s: any) => s.ticker);

    // Fetch latest prices for all symbols
    const priceData = await Promise.all(
      symbolTickers.map(async (ticker: string) => {
        try {
          const state = await this.latestPrice.getLatestPriceIncremental(ticker, '1d');
          if (state) {
            const symbol = symbols.find((s: any) => s.ticker === ticker);
            // TODO: Calculate change/changePercent from historical data
            return {
              ticker,
              name: symbol?.companyName ?? ticker,
              sector: symbol?.sector ?? 'Diğer',
              price: state.price,
              change: state.change,
              changePercent: state.changePercent,
              volume: state.volume ?? 0,
            };
          }
        } catch {
          // Ignore errors for individual symbols
        }
        return null;
      })
    );

    const validPrices = priceData.filter((p: any): p is NonNullable<typeof p> => p !== null);

    // BIST100 calculation (simple average for demo)
    const bist100Value = validPrices.length > 0 
      ? validPrices.reduce((sum: number, p: any) => sum + p.price, 0) / validPrices.length 
      : 0;
    const bist100Change = validPrices.length > 0
      ? validPrices.reduce((sum: number, p: any) => sum + p.change, 0) / validPrices.length
      : 0;
    const bist100ChangePercent = validPrices.length > 0
      ? validPrices.reduce((sum: number, p: any) => sum + p.changePercent, 0) / validPrices.length
      : 0;

    // Sector heatmap
    const sectorMap = new Map<string, { totalChange: number; count: number; stocks: typeof validPrices }>();
    for (const p of validPrices) {
      const existing = sectorMap.get(p.sector) || { totalChange: 0, count: 0, stocks: [] as typeof validPrices };
      existing.totalChange += p.changePercent;
      existing.count += 1;
      existing.stocks.push(p);
      sectorMap.set(p.sector, existing);
    }

    const sectorHeatmap = Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        changePercent: data.totalChange / data.count,
        stocks: data.count,
      }))
      .sort((a, b) => b.changePercent - a.changePercent);

    // Top gainers/losers
    const sortedByChange = [...validPrices].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sortedByChange.slice(0, 10).map((p: any) => ({
      ticker: p.ticker,
      name: p.name,
      changePercent: p.changePercent,
      price: p.price,
    }));
    const topLosers = [...sortedByChange].reverse().slice(0, 10).map((p: any) => ({
      ticker: p.ticker,
      name: p.name,
      changePercent: p.changePercent,
      price: p.price,
    }));

    // Volume leaders
    const volumeLeaders = [...validPrices]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map((p: any) => ({
        ticker: p.ticker,
        name: p.name,
        volume: p.volume,
        changePercent: p.changePercent,
      }));

    // Smart money & Catalyst leaders - use mock data for now
    const smartMoneyLeaders = symbolTickers.slice(0, 10).map((ticker: string, i: number) => ({
      ticker,
      name: symbols.find((s: any) => s.ticker === ticker)?.companyName ?? ticker,
      smartMoneyScore: 100 - i * 5,
      accumulation: i < 3 ? 'strong' : i < 6 ? 'moderate' : 'weak',
    }));

    const catalystLeaders = symbolTickers.slice(0, 10).map((ticker: string, i: number) => ({
      ticker,
      name: symbols.find((s: any) => s.ticker === ticker)?.companyName ?? ticker,
      catalystScore: 100 - i * 4,
      verified: i < 5,
    }));

    return {
      bist100: {
        value: bist100Value,
        change: bist100Change,
        changePercent: bist100ChangePercent,
      },
      sectorHeatmap,
      topGainers,
      topLosers,
      volumeLeaders,
      smartMoneyLeaders,
      catalystLeaders,
    };
  }
}