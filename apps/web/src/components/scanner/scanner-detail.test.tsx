import { render, screen, waitFor } from '@testing-library/react';
import { ScannerDetail } from './scanner-detail';
import { useScannerStore } from '@/stores/scanner-store';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    technicalAnalysis: vi.fn().mockResolvedValue({ score: 75, summary: 'Teknik analiz özeti' }),
    financialRules: vi.fn().mockResolvedValue({ score: 68, summary: 'Finansal analiz özeti' }),
  },
}));

beforeEach(() => {
  useScannerStore.setState({ selectedSymbol: null, rightPanelOpen: false });
  vi.clearAllMocks();
});

describe('ScannerDetail', () => {
  it('returns null when no selection', () => {
    const { container } = render(<ScannerDetail />);
    expect(container.innerHTML).toBe('');
  });

  it('renders detail when symbol selected', async () => {
    useScannerStore.setState({ selectedSymbol: 'GARAN', rightPanelOpen: true });
    render(<ScannerDetail />);
    expect(screen.getByText('GARAN')).toBeInTheDocument();
    expect(screen.getByLabelText('Kapat')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useScannerStore.setState({ selectedSymbol: 'GARAN', rightPanelOpen: true });
    render(<ScannerDetail />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders sections after load', async () => {
    useScannerStore.setState({ selectedSymbol: 'GARAN', rightPanelOpen: true });
    render(<ScannerDetail />);
    await waitFor(() => {
      expect(screen.getByText('Elite Değerlendirme')).toBeInTheDocument();
    });
    expect(screen.getByText('Finansal Özet')).toBeInTheDocument();
    expect(screen.getByText('Teknik Özet')).toBeInTheDocument();
    expect(screen.getByText('Akıllı Para Özeti')).toBeInTheDocument();
    expect(screen.getByText('Son İş Akışı')).toBeInTheDocument();
  });

  it('renders summaries', async () => {
    useScannerStore.setState({ selectedSymbol: 'GARAN', rightPanelOpen: true });
    render(<ScannerDetail />);
    await waitFor(() => {
      expect(screen.getByText('Teknik analiz özeti')).toBeInTheDocument();
    });
    expect(screen.getByText('Finansal analiz özeti')).toBeInTheDocument();
  });

  it('closes on close button', async () => {
    useScannerStore.setState({ selectedSymbol: 'GARAN', rightPanelOpen: true });
    render(<ScannerDetail />);
    await waitFor(() => {
      expect(screen.getByLabelText('Kapat')).toBeInTheDocument();
    });
    screen.getByLabelText('Kapat').click();
    expect(useScannerStore.getState().selectedSymbol).toBeNull();
  });

  it('renders score rows', async () => {
    useScannerStore.setState({ selectedSymbol: 'GARAN', rightPanelOpen: true });
    render(<ScannerDetail />);
    await waitFor(() => {
      expect(screen.getByText('Elite Skoru')).toBeInTheDocument();
    });
    expect(screen.getByText('Fırsat')).toBeInTheDocument();
  });
});
