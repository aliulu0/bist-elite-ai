import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';

interface WatchlistData {
  favorites: string[];
  pinned: string[];
  recent: string[];
  aiAlerts: { ticker: string; message: string; priority: string }[];
}

// In-memory storage (replace with database in production)
const watchlistStore: WatchlistData = {
  favorites: ['THYAO', 'GARAN', 'ASELS', 'SISE', 'TUPRS'],
  pinned: ['AKBNK', 'YKBNK'],
  recent: ['THYAO', 'GARAN', 'ASELS', 'SISE', 'TUPRS', 'AKBNK', 'YKBNK', 'KCHOL', 'TOASO', 'EREGL'],
  aiAlerts: [
    { ticker: 'THYAO', message: 'Early opportunity score crossed 80', priority: 'high' },
    { ticker: 'ASELS', message: 'Smart money accumulation detected', priority: 'medium' },
  ],
};

@ApiTags('Watchlist')
@Controller('watchlist')
export class WatchlistController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get user watchlist with favorites, pinned, recent, and AI alerts' })
  async getWatchlist(): Promise<WatchlistData> {
    return watchlistStore;
  }

  @Post('favorites/:ticker')
  @Public()
  @ApiOperation({ summary: 'Add ticker to favorites' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol' })
  async addFavorite(@Param('ticker') ticker: string): Promise<WatchlistData> {
    const normalized = ticker.toUpperCase();
    if (!watchlistStore.favorites.includes(normalized)) {
      watchlistStore.favorites.push(normalized);
    }
    return watchlistStore;
  }

  @Delete('favorites/:ticker')
  @Public()
  @ApiOperation({ summary: 'Remove ticker from favorites' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol' })
  async removeFavorite(@Param('ticker') ticker: string): Promise<WatchlistData> {
    const normalized = ticker.toUpperCase();
    watchlistStore.favorites = watchlistStore.favorites.filter(t => t !== normalized);
    return watchlistStore;
  }

  @Post('pinned/:ticker')
  @Public()
  @ApiOperation({ summary: 'Add ticker to pinned' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol' })
  async addPinned(@Param('ticker') ticker: string): Promise<WatchlistData> {
    const normalized = ticker.toUpperCase();
    if (!watchlistStore.pinned.includes(normalized)) {
      watchlistStore.pinned.push(normalized);
    }
    return watchlistStore;
  }

  @Delete('pinned/:ticker')
  @Public()
  @ApiOperation({ summary: 'Remove ticker from pinned' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol' })
  async removePinned(@Param('ticker') ticker: string): Promise<WatchlistData> {
    const normalized = ticker.toUpperCase();
    watchlistStore.pinned = watchlistStore.pinned.filter(t => t !== normalized);
    return watchlistStore;
  }

  @Post('recent/:ticker')
  @Public()
  @ApiOperation({ summary: 'Add ticker to recent analysis' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker symbol' })
  async addRecent(@Param('ticker') ticker: string): Promise<WatchlistData> {
    const normalized = ticker.toUpperCase();
    watchlistStore.recent = [normalized, ...watchlistStore.recent.filter(t => t !== normalized)].slice(0, 20);
    return watchlistStore;
  }
}