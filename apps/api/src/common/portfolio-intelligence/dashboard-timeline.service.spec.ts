import { DashboardTimelineService } from './dashboard-timeline.service';

describe('DashboardTimelineService', () => {
  let service: DashboardTimelineService;

  beforeEach(() => {
    service = new DashboardTimelineService();
  });

  describe('addOpportunityEvent', () => {
    it('should add event with generated id', () => {
      const event = service.addOpportunityEvent({
        type: 'DETECTED',
        symbol: 'THYAO',
        title: 'Yeni Firsat',
        description: 'Tespit edildi',
        timestamp: new Date().toISOString(),
        metadata: {},
      });

      expect(event.id).toBeDefined();
      expect(event.symbol).toBe('THYAO');
    });
  });

  describe('addRecommendationEvent', () => {
    it('should add recommendation event', () => {
      const event = service.addRecommendationEvent({
        type: 'CREATED',
        symbol: 'GARAN',
        title: 'Oneri Olusturuldu',
        description: 'Yeni oneri',
        timestamp: new Date().toISOString(),
        metadata: {},
      });

      expect(event.id).toContain('tl-rec');
    });
  });

  describe('addPortfolioEvent', () => {
    it('should add portfolio event', () => {
      const event = service.addPortfolioEvent({
        type: 'POSITION_OPENED',
        symbol: 'ASELS',
        title: 'Pozisyon Acildi',
        description: '100 adet',
        timestamp: new Date().toISOString(),
        metadata: {},
      });

      expect(event.id).toContain('tl-pf');
    });
  });

  describe('addRegimeEvent', () => {
    it('should add regime event', () => {
      const event = service.addRegimeEvent({
        type: 'TRANSITION',
        symbol: 'MARKET',
        title: 'Rejim Degisimi',
        description: 'BULL -> SIDEWAYS',
        timestamp: new Date().toISOString(),
        metadata: {},
      });

      expect(event.id).toContain('tl-rg');
    });
  });

  describe('getOpportunityEvents', () => {
    it('should return events sorted by timestamp desc', () => {
      service.addOpportunityEvent({
        type: 'DETECTED', symbol: 'A', title: 'A', description: '',
        timestamp: new Date(Date.now() - 100000).toISOString(), metadata: {},
      });
      service.addOpportunityEvent({
        type: 'DETECTED', symbol: 'B', title: 'B', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });

      const events = service.getOpportunityEvents();
      expect(events[0].symbol).toBe('B');
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        service.addOpportunityEvent({
          type: 'DETECTED', symbol: `S${i}`, title: `${i}`, description: '',
          timestamp: new Date().toISOString(), metadata: {},
        });
      }
      expect(service.getOpportunityEvents(5)).toHaveLength(5);
    });
  });

  describe('getWidget', () => {
    it('should return widget with all timelines', () => {
      service.addOpportunityEvent({
        type: 'DETECTED', symbol: 'THYAO', title: 'A', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });
      service.addRecommendationEvent({
        type: 'CREATED', symbol: 'GARAN', title: 'B', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });

      const widget = service.getWidget();
      expect(widget.opportunityTimeline).toHaveLength(1);
      expect(widget.recommendationTimeline).toHaveLength(1);
      expect(widget.portfolioTimeline).toHaveLength(0);
      expect(widget.regimeTimeline).toHaveLength(0);
      expect(widget.lastUpdated).toBeDefined();
    });
  });

  describe('getTotalEvents', () => {
    it('should count all events', () => {
      service.addOpportunityEvent({
        type: 'A', symbol: 'X', title: '', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });
      service.addPortfolioEvent({
        type: 'B', symbol: 'Y', title: '', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });

      expect(service.getTotalEvents()).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('should clear all events', () => {
      service.addOpportunityEvent({
        type: 'A', symbol: 'X', title: '', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });
      service.addRegimeEvent({
        type: 'B', symbol: 'Y', title: '', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });

      service.clearAll();
      expect(service.getTotalEvents()).toBe(0);
    });
  });

  describe('getEventsBySymbol', () => {
    it('should filter by symbol', () => {
      service.addOpportunityEvent({
        type: 'A', symbol: 'THYAO', title: '', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });
      service.addPortfolioEvent({
        type: 'B', symbol: 'GARAN', title: '', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });

      expect(service.getEventsBySymbol('THYAO')).toHaveLength(1);
      expect(service.getEventsBySymbol('GARAN')).toHaveLength(1);
    });
  });

  describe('getEventsByType', () => {
    it('should filter by type', () => {
      service.addOpportunityEvent({
        type: 'DETECTED', symbol: 'A', title: '', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });
      service.addOpportunityEvent({
        type: 'TRANSITION', symbol: 'B', title: '', description: '',
        timestamp: new Date().toISOString(), metadata: {},
      });

      expect(service.getEventsByType('DETECTED')).toHaveLength(1);
    });
  });

  describe('getEventsInRange', () => {
    it('should filter by time range', () => {
      const now = new Date();
      const old = new Date(now.getTime() - 100000);

      service.addOpportunityEvent({
        type: 'A', symbol: 'X', title: '', description: '',
        timestamp: old.toISOString(), metadata: {},
      });
      service.addOpportunityEvent({
        type: 'B', symbol: 'Y', title: '', description: '',
        timestamp: now.toISOString(), metadata: {},
      });

      const range = service.getEventsInRange(new Date(now.getTime() - 50000), now);
      expect(range).toHaveLength(1);
      expect(range[0].symbol).toBe('Y');
    });
  });
});
