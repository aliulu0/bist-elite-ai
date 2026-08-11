import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(() => {
    service = new CircuitBreakerService({
      failureThreshold: 3,
      recoveryIntervalMs: 1000,
      halfOpenMaxAttempts: 1,
    });
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      const state = service.getState('test-provider');
      expect(state.state).toBe('CLOSED');
      expect(state.consecutiveFailures).toBe(0);
    });

    it('should not have circuit open initially', () => {
      expect(service.isCircuitOpen('test-provider')).toBe(false);
    });
  });

  describe('recordSuccess', () => {
    it('should reset consecutive failures', () => {
      service.recordFailure('p1');
      service.recordFailure('p1');
      service.recordSuccess('p1');
      const state = service.getState('p1');
      expect(state.consecutiveFailures).toBe(0);
    });

    it('should transition HALF_OPEN to CLOSED', () => {
      service.recordFailure('p1');
      service.recordFailure('p1');
      service.recordFailure('p1');
      const state = service.getState('p1');
      state.state = 'HALF_OPEN';
      state.openedAt = Date.now() - 2000;
      service.recordSuccess('p1');
      expect(service.getState('p1').state).toBe('CLOSED');
    });
  });

  describe('recordFailure', () => {
    it('should increment consecutive failures', () => {
      service.recordFailure('p1');
      expect(service.getState('p1').consecutiveFailures).toBe(1);
    });

    it('should open circuit after threshold', () => {
      service.recordFailure('p1');
      service.recordFailure('p1');
      service.recordFailure('p1');
      expect(service.getState('p1').state).toBe('OPEN');
      expect(service.isCircuitOpen('p1')).toBe(true);
    });

    it('should re-open from HALF_OPEN on failure', () => {
      service.recordFailure('p1');
      service.recordFailure('p1');
      service.recordFailure('p1');
      const state = service.getState('p1');
      state.state = 'HALF_OPEN';
      state.openedAt = Date.now() - 2000;
      service.recordFailure('p1');
      expect(service.getState('p1').state).toBe('OPEN');
    });
  });

  describe('recovery', () => {
    it('should transition to HALF_OPEN after recovery interval', () => {
      service.recordFailure('p1');
      service.recordFailure('p1');
      service.recordFailure('p1');
      const state = service.getState('p1');
      state.openedAt = Date.now() - 2000;
      expect(service.isCircuitOpen('p1')).toBe(false);
      expect(service.getState('p1').state).toBe('HALF_OPEN');
    });

    it('should stay OPEN before recovery interval', () => {
      service.recordFailure('p1');
      service.recordFailure('p1');
      service.recordFailure('p1');
      expect(service.isCircuitOpen('p1')).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset provider to CLOSED', () => {
      service.recordFailure('p1');
      service.recordFailure('p1');
      service.recordFailure('p1');
      service.reset('p1');
      expect(service.getState('p1').state).toBe('CLOSED');
      expect(service.getState('p1').consecutiveFailures).toBe(0);
    });

    it('should reset all providers', () => {
      service.recordFailure('p1');
      service.recordFailure('p2');
      service.resetAll();
      expect(service.getState('p1').state).toBe('CLOSED');
      expect(service.getState('p2').state).toBe('CLOSED');
    });
  });

  describe('getAllStates', () => {
    it('should return all provider states', () => {
      service.getState('p1');
      service.getState('p2');
      const all = service.getAllStates();
      expect(Object.keys(all)).toContain('p1');
      expect(Object.keys(all)).toContain('p2');
    });
  });
});
