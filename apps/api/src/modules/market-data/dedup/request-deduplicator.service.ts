import { Injectable, Optional } from '@nestjs/common';

export interface RequestDeduplicatorStats {
  executed: number;
  deduplicated: number;
  memoryHits: number;
  inFlight: number;
  completed: number;
  memoryWindowMs: number;
}

interface MemoryEntry<T = unknown> {
  value: T;
  timestamp: number;
}

export const DEFAULT_SHORT_TERM_MEMORY_WINDOW_MS = 15_000;

@Injectable()
export class RequestDeduplicatorService {
  private readonly inflight = new Map<string, Promise<unknown>>();
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly memoryWindowMs: number;
  private executed = 0;
  private deduplicated = 0;
  private memoryHits = 0;

  constructor(@Optional() memoryWindowMs?: number) {
    this.memoryWindowMs = memoryWindowMs ?? DEFAULT_SHORT_TERM_MEMORY_WINDOW_MS;
  }

  async execute<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) {
      this.deduplicated++;
      return existing as Promise<T>;
    }

    const remembered = this.memory.get(key);
    if (remembered && Date.now() - remembered.timestamp <= this.memoryWindowMs) {
      this.memoryHits++;
      return remembered.value as T;
    }

    this.executed++;
    const promise = factory()
      .then((value) => {
        this.inflight.delete(key);
        this.remember(key, value);
        return value;
      })
      .catch((error) => {
        this.inflight.delete(key);
        throw error;
      });

    this.inflight.set(key, promise);
    return promise;
  }

  private remember(key: string, value: unknown): void {
    if (this.memoryWindowMs <= 0) return;
    this.memory.set(key, { value, timestamp: Date.now() });
    if (this.memory.size > 500) {
      let oldestKey: string | null = null;
      let oldestTs = Infinity;
      for (const [k, entry] of this.memory) {
        if (entry.timestamp < oldestTs) {
          oldestTs = entry.timestamp;
          oldestKey = k;
        }
      }
      if (oldestKey) this.memory.delete(oldestKey);
    }
  }

  getStats(): RequestDeduplicatorStats {
    return {
      executed: this.executed,
      deduplicated: this.deduplicated,
      memoryHits: this.memoryHits,
      inFlight: this.inflight.size,
      completed: this.executed,
      memoryWindowMs: this.memoryWindowMs,
    };
  }

  isInFlight(key: string): boolean {
    return this.inflight.has(key);
  }

  hasMemory(key: string): boolean {
    const entry = this.memory.get(key);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > this.memoryWindowMs) {
      this.memory.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.inflight.clear();
    this.memory.clear();
  }
}
