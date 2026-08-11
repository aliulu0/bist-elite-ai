import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsEmptyState } from '../alerts-empty-state';

describe('AlertsEmptyState', () => {
  it('renders default message', () => {
    render(<AlertsEmptyState />);
    expect(screen.getByText('Henüz alarm bulunmuyor')).toBeDefined();
  });

  it('renders custom message', () => {
    render(<AlertsEmptyState message="Özel mesaj" />);
    expect(screen.getByText('Özel mesaj')).toBeDefined();
  });
});
