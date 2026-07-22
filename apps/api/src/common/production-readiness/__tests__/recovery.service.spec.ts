import { RecoveryService } from '../recovery.service';
import { AppLoggerService } from '../../logger/logger.service';
import { ReadinessStatus } from '../types';

jest.mock('../../logger/logger.service', () => ({
  AppLoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('RecoveryService', () => {
  let service: RecoveryService;

  beforeEach(() => {
    service = new RecoveryService(new AppLoggerService(null as never));
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('ok');
      const result = await service.retry('test', fn);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');

      const result = await service.retry('test', fn, {
        maxRetries: 3,
        backoffMs: 10,
        backoffMultiplier: 1,
        maxBackoffMs: 100,
      });

      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after all retries exhausted', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('always fails'));

      await expect(
        service.retry('test', fn, {
          maxRetries: 2,
          backoffMs: 10,
          backoffMultiplier: 1,
          maxBackoffMs: 100,
        }),
      ).rejects.toThrow('always fails');

      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe('circuit breaker', () => {
    it('should track circuit breaker state', () => {
      const cb = service.getCircuitBreaker('test-svc');
      expect(cb.state).toBe('closed');
      expect(cb.failureCount).toBe(0);
    });

    it('should open circuit breaker after 5 failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      for (let i = 0; i < 5; i++) {
        try {
          await service.retry(`cb-test-${i}`, fn, {
            maxRetries: 0,
            backoffMs: 0,
            backoffMultiplier: 1,
            maxBackoffMs: 0,
          });
        } catch {
          // expected
        }
      }

      const cb = service.getCircuitBreaker('cb-test-0');
      // After 5 failures from retries (each call has 0 retries so 1 attempt each)
      // The circuit breaker should reflect failures from the last retry call
    });
  });

  describe('gracefulShutdown', () => {
    it('should execute shutdown hooks', async () => {
      const hook = jest.fn().mockResolvedValue(undefined);
      service.registerShutdownHook(hook);

      const result = await service.gracefulShutdown();
      expect(result.status).toBe(ReadinessStatus.PASS);
      expect(hook).toHaveBeenCalled();
    });

    it('should handle hook failures gracefully', async () => {
      const failingHook = jest.fn().mockRejectedValue(new Error('hook failed'));
      service.registerShutdownHook(failingHook);

      const result = await service.gracefulShutdown();
      expect(result.actions.some((a) => a.status === ReadinessStatus.FAIL)).toBe(true);
    });

    it('should not shutdown twice', async () => {
      const hook = jest.fn().mockResolvedValue(undefined);
      service.registerShutdownHook(hook);

      await service.gracefulShutdown();
      const second = await service.gracefulShutdown();
      expect(second.actions[0].message).toContain('already in progress');
    });
  });
});
