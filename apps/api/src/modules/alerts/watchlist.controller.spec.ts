import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistController } from './watchlist.controller';
import { WatchlistManager } from './services/watchlist-manager.service';

const mockManager = {
  getWatchlistNames: jest.fn(),
  getWatchlist: jest.fn(),
  getWatchlistCount: jest.fn(),
  getAllSymbols: jest.fn(),
  addToWatchlist: jest.fn(),
  removeFromWatchlist: jest.fn(),
};

describe('WatchlistController', () => {
  let controller: WatchlistController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchlistController],
      providers: [{ provide: WatchlistManager, useValue: mockManager }],
    }).compile();
    controller = module.get<WatchlistController>(WatchlistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /watchlist', () => {
    it('should list all watchlists', () => {
      mockManager.getWatchlistNames.mockReturnValue(['FAVORITES', 'PORTFOLIO']);
      mockManager.getWatchlist.mockImplementation((name: string) =>
        name === 'FAVORITES' ? [{ symbol: 'THYAO', addedAt: 'x' }] : [],
      );
      mockManager.getWatchlistCount.mockImplementation((name: string) => (name === 'FAVORITES' ? 1 : 0));
      mockManager.getAllSymbols.mockReturnValue(['THYAO']);

      const result = controller.listWatchlists();
      expect(result.success).toBe(true);
      expect(result.data.lists).toHaveLength(2);
      expect(result.data.totalSymbols).toEqual(['THYAO']);
    });
  });

  describe('GET /watchlist/symbols', () => {
    it('should return all symbols', () => {
      mockManager.getAllSymbols.mockReturnValue(['THYAO', 'GARAN']);
      const result = controller.getSymbols();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('GET /watchlist/:name', () => {
    it('should return a single watchlist', () => {
      mockManager.getWatchlist.mockReturnValue([{ symbol: 'THYAO', addedAt: 'x' }]);
      mockManager.getWatchlistCount.mockReturnValue(1);
      const result = controller.getWatchlist('FAVORITES' as any);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('FAVORITES');
      expect(result.data.count).toBe(1);
    });
  });

  describe('POST /watchlist/:name/:symbol', () => {
    it('should add symbol uppercased', () => {
      mockManager.addToWatchlist.mockReturnValue(true);
      const result = controller.addToWatchlist('FAVORITES' as any, 'thyao');
      expect(result.success).toBe(true);
      expect(mockManager.addToWatchlist).toHaveBeenCalledWith('FAVORITES', 'THYAO');
    });

    it('should report when already present', () => {
      mockManager.addToWatchlist.mockReturnValue(false);
      const result = controller.addToWatchlist('FAVORITES' as any, 'THYAO');
      expect(result.success).toBe(false);
    });
  });

  describe('DELETE /watchlist/:name/:symbol', () => {
    it('should remove symbol uppercased', () => {
      mockManager.removeFromWatchlist.mockReturnValue(true);
      const result = controller.removeFromWatchlist('FAVORITES' as any, 'thyao');
      expect(result.success).toBe(true);
      expect(mockManager.removeFromWatchlist).toHaveBeenCalledWith('FAVORITES', 'THYAO');
    });

    it('should report when not found', () => {
      mockManager.removeFromWatchlist.mockReturnValue(false);
      const result = controller.removeFromWatchlist('FAVORITES' as any, 'THYAO');
      expect(result.success).toBe(false);
    });
  });
});
