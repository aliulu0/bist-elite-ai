import { render, screen } from '@testing-library/react';
import { NotificationPanel } from './notification-panel';
import type { EventBusEvent } from './notification-panel';

const mockEvents: EventBusEvent[] = [
  { id: '1', type: 'WORKFLOW_COMPLETED', timestamp: '2025-01-01T12:00:00Z', data: {} },
  { id: '2', type: 'PROVIDER_ERROR', timestamp: '2025-01-01T11:30:00Z', data: {} },
  { id: '3', type: 'SCANNER_COMPLETED', timestamp: '2025-01-01T10:00:00Z', data: {} },
  { id: '4', type: 'SYSTEM_ALERT', timestamp: '2025-01-01T09:00:00Z', data: {} },
];

describe('NotificationPanel', () => {
  it('renders title', () => {
    render(<NotificationPanel events={[]} />);
    expect(screen.getByText('Son Olaylar')).toBeInTheDocument();
  });

  it('renders events with formatted names', () => {
    render(<NotificationPanel events={mockEvents} />);
    expect(screen.getByText('Workflow Completed')).toBeInTheDocument();
    expect(screen.getByText('Provider Error')).toBeInTheDocument();
    expect(screen.getByText('Scanner Completed')).toBeInTheDocument();
  });

  it('shows empty message', () => {
    render(<NotificationPanel events={[]} />);
    expect(screen.getByText('Olay bulunamadı')).toBeInTheDocument();
  });

  it('shows loading', () => {
    render(<NotificationPanel events={[]} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error', () => {
    render(<NotificationPanel events={[]} error="Hata" />);
    expect(screen.getByText('Hata')).toBeInTheDocument();
  });

  it('renders max 8 events', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      type: `EVENT_${i}`,
      timestamp: '2025-01-01T12:00:00Z',
      data: {},
    }));
    render(<NotificationPanel events={many} />);
    expect(screen.getByText('Event 0')).toBeInTheDocument();
    expect(screen.queryByText('Event 8')).not.toBeInTheDocument();
  });

  it('renders event count in description', () => {
    render(<NotificationPanel events={mockEvents} />);
    expect(screen.getByText('4 olay')).toBeInTheDocument();
  });

  it('renders data when available as string', () => {
    const event: EventBusEvent = { id: '99', type: 'TEST', timestamp: '2025-01-01T12:00:00Z', data: 'custom message' };
    render(<NotificationPanel events={[event]} />);
    expect(screen.getByText('custom message')).toBeInTheDocument();
  });

  it('renders data when available as object', () => {
    const event: EventBusEvent = { id: '99', type: 'TEST', timestamp: '2025-01-01T12:00:00Z', data: { key: 'val' } };
    render(<NotificationPanel events={[event]} />);
    expect(screen.getByText('{"key":"val"}')).toBeInTheDocument();
  });

  it('renders radio icon', () => {
    const { container } = render(<NotificationPanel events={mockEvents} />);
    expect(container.querySelector('.lucide-radio')).toBeInTheDocument();
  });
});
