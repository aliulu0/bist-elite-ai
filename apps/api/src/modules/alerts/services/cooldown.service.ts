import { Injectable, Logger } from '@nestjs/common';
import { AlertType, AlertCooldownConfig, CooldownPeriod } from '../alerts.types';
import { DEFAULT_COOLDOWN_CONFIG } from '../alerts.config';

interface CooldownKey {
  alertType: AlertType;
  symbol: string;
  channel: string;
}

interface CooldownEntry {
  expiresAt: number;
  alertId: string;
}

@Injectable()
export class CooldownEngine {
  private readonly logger = new Logger(CooldownEngine.name);
  private readonly cooldowns = new Map<string, CooldownEntry>();
  private readonly config: AlertCooldownConfig;

  constructor(config?: Partial<AlertCooldownConfig>) {
    this.config = { ...DEFAULT_COOLDOWN_CONFIG, ...config };
  }

  private buildKey(alertType: AlertType, symbol: string, channel: string): string {
    const parts: string[] = [alertType];
    if (this.config.perSymbol) parts.push(symbol);
    if (this.config.perChannel) parts.push(channel);
    return parts.join(':');
  }

  private getCooldownMs(alertType: AlertType): number {
    const minutes = this.config.perAlertType[alertType] ?? this.config.periodMinutes;
    return minutes * 60 * 1000;
  }

  isOnCooldown(alertType: AlertType, symbol: string, channel: string): boolean {
    const key = this.buildKey(alertType, symbol, channel);
    const entry = this.cooldowns.get(key);
    if (!entry) return false;
    const now = Date.now();
    if (now >= entry.expiresAt) {
      this.cooldowns.delete(key);
      return false;
    }
    return true;
  }

  getRemainingMs(alertType: AlertType, symbol: string, channel: string): number | null {
    const key = this.buildKey(alertType, symbol, channel);
    const entry = this.cooldowns.get(key);
    if (!entry) return null;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : null;
  }

  setCooldown(alertType: AlertType, symbol: string, channel: string, alertId: string): void {
    const key = this.buildKey(alertType, symbol, channel);
    const cooldownMs = this.getCooldownMs(alertType);
    this.cooldowns.set(key, { expiresAt: Date.now() + cooldownMs, alertId });
    this.logger.debug(`Cooldown set for ${key}: ${cooldownMs}ms`);
  }

  clearCooldown(alertType: AlertType, symbol: string, channel: string): void {
    const key = this.buildKey(alertType, symbol, channel);
    this.cooldowns.delete(key);
  }

  clearAll(): void {
    this.cooldowns.clear();
  }

  getActiveCooldownCount(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cooldowns.entries()) {
      if (now < entry.expiresAt) count++;
      else this.cooldowns.delete(key);
    }
    return count;
  }
}
