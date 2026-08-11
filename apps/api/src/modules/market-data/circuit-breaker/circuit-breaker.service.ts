import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  CircuitState,
  CircuitBreakerState,
  CircuitBreakerConfig,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from './circuit-breaker.types';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerState>();
  private readonly config: CircuitBreakerConfig;

  constructor(@Optional() config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  isCircuitOpen(providerName: string): boolean {
    const state = this.getState(providerName);
    if (state.state === 'OPEN') {
      if (this.shouldAttemptRecovery(state)) {
        state.state = 'HALF_OPEN';
        state.openedAt = null;
        this.logger.log(`${providerName} circuit transitioning to HALF_OPEN`);
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(providerName: string): void {
    const state = this.getState(providerName);
    state.consecutiveFailures = 0;
    state.lastSuccessTime = Date.now();

    if (state.state === 'HALF_OPEN') {
      state.state = 'CLOSED';
      state.openedAt = null;
      this.logger.log(`${providerName} circuit CLOSED after successful recovery`);
    }
  }

  recordFailure(providerName: string): void {
    const state = this.getState(providerName);
    state.consecutiveFailures++;
    state.lastFailureTime = Date.now();

    if (state.state === 'HALF_OPEN') {
      state.state = 'OPEN';
      state.openedAt = Date.now();
      this.logger.warn(`${providerName} circuit re-OPENED from HALF_OPEN`);
      return;
    }

    if (state.consecutiveFailures >= this.config.failureThreshold) {
      state.state = 'OPEN';
      state.openedAt = Date.now();
      this.logger.warn(
        `${providerName} circuit OPENED after ${state.consecutiveFailures} consecutive failures`,
      );
    }
  }

  getState(providerName: string): CircuitBreakerState {
    if (!this.circuits.has(providerName)) {
      this.circuits.set(providerName, {
        state: 'CLOSED',
        consecutiveFailures: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        openedAt: null,
      });
    }
    return this.circuits.get(providerName)!;
  }

  reset(providerName: string): void {
    this.circuits.set(providerName, {
      state: 'CLOSED',
      consecutiveFailures: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      openedAt: null,
    });
    this.logger.log(`${providerName} circuit reset to CLOSED`);
  }

  resetAll(): void {
    for (const name of this.circuits.keys()) {
      this.reset(name);
    }
  }

  getAllStates(): Record<string, CircuitBreakerState> {
    const result: Record<string, CircuitBreakerState> = {};
    for (const [name, state] of this.circuits) {
      result[name] = { ...state };
    }
    return result;
  }

  private shouldAttemptRecovery(state: CircuitBreakerState): boolean {
    if (!state.openedAt) return false;
    return Date.now() - state.openedAt >= this.config.recoveryIntervalMs;
  }
}
