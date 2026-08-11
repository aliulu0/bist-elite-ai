export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerState {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  openedAt: number | null;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryIntervalMs: number;
  halfOpenMaxAttempts: number;
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  recoveryIntervalMs: 5 * 60 * 1000,
  halfOpenMaxAttempts: 1,
};
