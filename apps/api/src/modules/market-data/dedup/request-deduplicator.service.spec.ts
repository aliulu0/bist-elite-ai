import { RequestDeduplicatorService } from './request-deduplicator.service';

describe('RequestDeduplicatorService', () => {
  let service: RequestDeduplicatorService;

  beforeEach(() => {
    service = new RequestDeduplicatorService(0);
  });

  it('executes factory and resolves value', async () => {
    await expect(service.execute('a', async () => 42)).resolves.toBe(42);
  });

  it('deduplicates concurrent identical keys', async () => {
    let calls = 0;
    const factory = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 10));
      return 'data';
    };

    const [r1, r2, r3] = await Promise.all([
      service.execute('k', factory),
      service.execute('k', factory),
      service.execute('k', factory),
    ]);

    expect(r1).toBe('data');
    expect(r2).toBe('data');
    expect(r3).toBe('data');
    expect(calls).toBe(1);
    expect(service.getStats().deduplicated).toBe(2);
  });

  it('allows a new request after the in-flight completes', async () => {
    let calls = 0;
    const factory = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      return calls;
    };

    const first = await service.execute('k', factory);
    const second = await service.execute('k', factory);

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(calls).toBe(2);
  });

  it('removes in-flight entry on failure', async () => {
    await expect(
      service.execute('k', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(service.isInFlight('k')).toBe(false);
    await expect(service.execute('k', async () => 'ok')).resolves.toBe('ok');
  });

  it('tracks stats', async () => {
    await service.execute('a', async () => 1);
    await service.execute('b', async () => 2);
    const stats = service.getStats();
    expect(stats.executed).toBe(2);
    expect(stats.completed).toBe(2);
    expect(stats.inFlight).toBe(0);
  });
});

describe('RequestDeduplicatorService short-term memory', () => {
  it('5 parallel requests resolve in exactly 1 provider call', async () => {
    const parallelService = new RequestDeduplicatorService(0);
    let calls = 0;
    const factory = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 10));
      return 'data';
    };

    const results = await Promise.all(
      Array.from({ length: 5 }, () => parallelService.execute('parallel-key', factory)),
    );

    expect(results).toEqual(['data', 'data', 'data', 'data', 'data']);
    expect(calls).toBe(1);
    expect(parallelService.getStats().deduplicated).toBe(4);
  });

  it('10 sequential requests within the memory window cause 0 recalculations', async () => {
    const memoryService = new RequestDeduplicatorService(30_000);
    let calls = 0;
    const factory = async () => {
      calls++;
      return calls;
    };

    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(await memoryService.execute('seq-key', factory));
    }

    expect(results).toHaveLength(10);
    expect(calls).toBe(1);
    expect(memoryService.getStats().memoryHits).toBe(9);
  });

  it('reuses a completed result within the memory window (sequential dedup)', async () => {
    const memoryService = new RequestDeduplicatorService(15_000);
    let calls = 0;
    const factory = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      return 'data';
    };

    const first = await memoryService.execute('k', factory);
    const second = await memoryService.execute('k', factory);

    expect(first).toBe('data');
    expect(second).toBe('data');
    expect(calls).toBe(1);
    expect(memoryService.getStats().memoryHits).toBe(1);
  });

  it('expires the memory entry after the window', async () => {
    const memoryService = new RequestDeduplicatorService(20);
    let calls = 0;
    const factory = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 1));
      return calls;
    };

    const first = await memoryService.execute('k', factory);
    expect(memoryService.hasMemory('k')).toBe(true);
    await new Promise((r) => setTimeout(r, 40));
    expect(memoryService.hasMemory('k')).toBe(false);
    const second = await memoryService.execute('k', factory);

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(calls).toBe(2);
  });

  it('does not remember failed executions', async () => {
    const memoryService = new RequestDeduplicatorService(15_000);
    await expect(
      memoryService.execute('k', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(memoryService.hasMemory('k')).toBe(false);
  });

  it('clears memory on clear()', async () => {
    const memoryService = new RequestDeduplicatorService(15_000);
    await memoryService.execute('k', async () => 'data');
    expect(memoryService.hasMemory('k')).toBe(true);
    memoryService.clear();
    expect(memoryService.hasMemory('k')).toBe(false);
  });
});
