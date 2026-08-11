import { describe, it, expect } from 'vitest';
import {
  PROVIDER_TABS,
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_COLORS,
  PROVIDER_STATUS_BADGE,
  DEFAULT_FAILOVER_ORDER,
  PROVIDER_NAMES,
} from '../provider-types';

describe('provider-types', () => {
  it('has correct tab definitions', () => {
    expect(PROVIDER_TABS).toHaveLength(5);
    expect(PROVIDER_TABS[0].key).toBe('overview');
    expect(PROVIDER_TABS[0].label).toBe('Genel');
    expect(PROVIDER_TABS[1].key).toBe('yahoo');
    expect(PROVIDER_TABS[2].key).toBe('fintables');
    expect(PROVIDER_TABS[3].key).toBe('investing');
    expect(PROVIDER_TABS[4].key).toBe('google-discovery');
  });

  it('has all status labels', () => {
    expect(PROVIDER_STATUS_LABELS.HEALTHY).toBe('Sağlıklı');
    expect(PROVIDER_STATUS_LABELS.DEGRADED).toBe('Düşük');
    expect(PROVIDER_STATUS_LABELS.CRITICAL).toBe('Kritik');
    expect(PROVIDER_STATUS_LABELS.OFFLINE).toBe('Çevrimdışı');
    expect(PROVIDER_STATUS_LABELS.UNKNOWN).toBe('Bilinmiyor');
  });

  it('has all status colors', () => {
    expect(PROVIDER_STATUS_COLORS.HEALTHY).toBe('text-success');
    expect(PROVIDER_STATUS_COLORS.DEGRADED).toBe('text-warning');
    expect(PROVIDER_STATUS_COLORS.CRITICAL).toBe('text-destructive');
    expect(PROVIDER_STATUS_COLORS.OFFLINE).toBe('text-destructive');
    expect(PROVIDER_STATUS_COLORS.UNKNOWN).toBe('text-muted-foreground');
  });

  it('has all status badge variants', () => {
    expect(PROVIDER_STATUS_BADGE.HEALTHY).toBe('success');
    expect(PROVIDER_STATUS_BADGE.DEGRADED).toBe('warning');
    expect(PROVIDER_STATUS_BADGE.CRITICAL).toBe('danger');
    expect(PROVIDER_STATUS_BADGE.OFFLINE).toBe('danger');
  });

  it('has default failover order', () => {
    expect(DEFAULT_FAILOVER_ORDER).toHaveLength(4);
    expect(DEFAULT_FAILOVER_ORDER[0]).toBe('Yahoo Finance');
    expect(DEFAULT_FAILOVER_ORDER[1]).toBe('Fintables');
  });

  it('has provider names', () => {
    expect(PROVIDER_NAMES['yahoo']).toBe('Yahoo Finance');
    expect(PROVIDER_NAMES['fintables']).toBe('Fintables');
    expect(PROVIDER_NAMES['investing']).toBe('Investing');
    expect(PROVIDER_NAMES['google-discovery']).toBe('Google Discovery');
  });
});
