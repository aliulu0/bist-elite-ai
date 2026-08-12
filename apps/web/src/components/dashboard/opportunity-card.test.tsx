import { render, screen } from '@testing-library/react';
import { OpportunityCard } from './opportunity-card';
import type { Opportunity } from './opportunity-card';

const mockOpps: Opportunity[] = [
  { symbol: 'GARAN', score: 85, opportunityScore: 92, reason: 'Güçlü teknik sinyal' },
  { symbol: 'AKBNK', score: 70, opportunityScore: 65, reason: 'Volume artışı' },
  { symbol: 'EREGL', score: 55, opportunityScore: 45, reason: 'RSI aşırı satım' },
];

describe('OpportunityCard', () => {
  it('renders title', () => {
    render(<OpportunityCard opportunities={[]} />);
    expect(screen.getByText('En İyi Fırsatlar')).toBeInTheDocument();
  });

  it('renders opportunities', () => {
    render(<OpportunityCard opportunities={mockOpps} />);
    expect(screen.getByText('GARAN')).toBeInTheDocument();
    expect(screen.getByText('AKBNK')).toBeInTheDocument();
    expect(screen.getByText('EREGL')).toBeInTheDocument();
  });

  it('renders reasons', () => {
    render(<OpportunityCard opportunities={mockOpps} />);
    expect(screen.getByText('Güçlü teknik sinyal')).toBeInTheDocument();
    expect(screen.getByText('Volume artışı')).toBeInTheDocument();
  });

  it('shows empty message when no opportunities', () => {
    render(<OpportunityCard opportunities={[]} />);
    expect(screen.getByText('Fırsat bulunamadı')).toBeInTheDocument();
  });

  it('shows loading', () => {
    render(<OpportunityCard opportunities={[]} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error', () => {
    render(<OpportunityCard opportunities={[]} error="Hata oluştu" />);
    expect(screen.getByText('Hata oluştu')).toBeInTheDocument();
  });

  it('renders max 8 items', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      symbol: `SYM${i}`,
      score: 50,
      opportunityScore: 50,
      reason: 'test',
    }));
    render(<OpportunityCard opportunities={many} />);
    expect(screen.getByText('SYM0')).toBeInTheDocument();
    expect(screen.queryByText('SYM8')).not.toBeInTheDocument();
  });

  it('renders score badges correctly', () => {
    render(<OpportunityCard opportunities={[mockOpps[0]]} />);
    expect(screen.getByText('Güçlü')).toBeInTheDocument();
  });

  it('renders warning badge for medium score', () => {
    render(<OpportunityCard opportunities={[mockOpps[2]]} />);
    expect(screen.getByText('Orta')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<OpportunityCard opportunities={mockOpps} />);
    expect(screen.getByText('Hisse')).toBeInTheDocument();
    expect(screen.getByText('Skor')).toBeInTheDocument();
    expect(screen.getByText('Neden')).toBeInTheDocument();
  });

  it('renders decision status and score columns when decision data present', () => {
    const withDecision: Opportunity[] = [
      {
        symbol: 'THYAO',
        score: 85,
        opportunityScore: 85,
        reason: 'Erken fırsat',
        decisionScore: 78,
        decisionStatus: 'EARLY_OPPORTUNITY',
        earlyOpportunity: true,
        trendStage: 'Early',
      },
    ];
    render(<OpportunityCard opportunities={withDecision} />);
    expect(screen.getByText('Karar')).toBeInTheDocument();
    expect(screen.getByText('Karar Skoru')).toBeInTheDocument();
    expect(screen.getByText('Trend')).toBeInTheDocument();
    expect(screen.getByText('Erken')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('Early')).toBeInTheDocument();
  });

  it('omits decision columns when no decision data', () => {
    render(<OpportunityCard opportunities={mockOpps} />);
    expect(screen.queryByText('Karar Skoru')).not.toBeInTheDocument();
    expect(screen.queryByText('Trend')).not.toBeInTheDocument();
  });
});
