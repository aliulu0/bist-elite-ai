import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators';
import { WatchlistManager } from './services/watchlist-manager.service';
import { WatchlistName } from './alerts.types';

@ApiTags('Watchlist')
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistManager: WatchlistManager) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all watchlists with entries' })
  listWatchlists() {
    const names = this.watchlistManager.getWatchlistNames();
    return {
      success: true,
      data: {
        lists: names.map((name) => ({
          name,
          entries: this.watchlistManager.getWatchlist(name),
          count: this.watchlistManager.getWatchlistCount(name),
        })),
        totalSymbols: this.watchlistManager.getAllSymbols(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('symbols')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all symbols across watchlists' })
  getSymbols() {
    return {
      success: true,
      data: this.watchlistManager.getAllSymbols(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':name')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a watchlist by name' })
  @ApiParam({ name: 'name', enum: ['FAVORITES', 'PORTFOLIO', 'LONG_TERM', 'SHORT_TERM', 'GROWTH', 'DIVIDEND', 'CUSTOM'] })
  getWatchlist(@Param('name') name: WatchlistName) {
    return {
      success: true,
      data: {
        name,
        entries: this.watchlistManager.getWatchlist(name),
        count: this.watchlistManager.getWatchlistCount(name),
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':name/:symbol')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a symbol to a watchlist' })
  @ApiParam({ name: 'name', enum: ['FAVORITES', 'PORTFOLIO', 'LONG_TERM', 'SHORT_TERM', 'GROWTH', 'DIVIDEND', 'CUSTOM'] })
  @ApiParam({ name: 'symbol', type: String })
  addToWatchlist(@Param('name') name: WatchlistName, @Param('symbol') symbol: string) {
    const added = this.watchlistManager.addToWatchlist(name, symbol.toUpperCase());
    return {
      success: added,
      message: added ? `Added ${symbol.toUpperCase()} to ${name}` : `Already in ${name}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':name/:symbol')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a symbol from a watchlist' })
  @ApiParam({ name: 'name', enum: ['FAVORITES', 'PORTFOLIO', 'LONG_TERM', 'SHORT_TERM', 'GROWTH', 'DIVIDEND', 'CUSTOM'] })
  @ApiParam({ name: 'symbol', type: String })
  removeFromWatchlist(@Param('name') name: WatchlistName, @Param('symbol') symbol: string) {
    const removed = this.watchlistManager.removeFromWatchlist(name, symbol.toUpperCase());
    return {
      success: removed,
      message: removed ? `Removed ${symbol.toUpperCase()} from ${name}` : `Not found in ${name}`,
      timestamp: new Date().toISOString(),
    };
  }
}
