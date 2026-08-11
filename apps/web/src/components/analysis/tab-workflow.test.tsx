import { render, screen, waitFor } from '@testing-library/react';
import { TabWorkflow } from './tab-workflow';
import { mockAnalysisResult } from './mock-data';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    workflows: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('TabWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders İş Akışları title', () => {
    render(<TabWorkflow data={mockAnalysisResult} />);
    expect(screen.getByText('İş Akışları')).toBeInTheDocument();
  });

  it('renders İş Akışı Durumu card', () => {
    render(<TabWorkflow data={mockAnalysisResult} />);
    expect(screen.getByText('İş Akışı Durumu')).toBeInTheDocument();
  });

  it('shows empty state when no workflows', async () => {
    render(<TabWorkflow data={mockAnalysisResult} />);
    await waitFor(() => {
      expect(screen.getByText('İş akışı bulunamadı')).toBeInTheDocument();
    });
  });

  it('calls SDK on mount', async () => {
    const sdk = await import('@/lib/sdk');
    render(<TabWorkflow data={mockAnalysisResult} />);
    await waitFor(() => {
      expect(sdk.sdkClient.workflows).toHaveBeenCalled();
    });
  });

  it('shows workflows when available', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.workflows).mockResolvedValueOnce({
      data: [
        {
          id: 'wf-1',
          type: 'single_stock_analysis',
          status: 'completed',
          symbol: 'GARAN',
          steps: [{ step: 'fetch_data', status: 'completed', durationMs: 100 }],
          currentStep: 'done',
          progress: 100,
          durationMs: 5000,
          createdAt: '2025-01-15',
        },
      ],
    } as never);
    render(<TabWorkflow data={mockAnalysisResult} />);
    await waitFor(() => {
      expect(screen.getByText('single_stock_analysis')).toBeInTheDocument();
    });
    expect(screen.getByText('Tamamlandı')).toBeInTheDocument();
  });

  it('handles SDK error', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.workflows).mockRejectedValueOnce(new Error('fail'));
    render(<TabWorkflow data={mockAnalysisResult} />);
    await waitFor(() => {
      expect(screen.getByText('İş akışları yüklenirken hata oluştu')).toBeInTheDocument();
    });
  });

  it('filters workflows by symbol', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.workflows).mockResolvedValueOnce({
      data: [
        { id: 'wf-1', type: 'backtest', status: 'running', symbol: 'GARAN', steps: [], currentStep: 'run', progress: 50, createdAt: '2025-01-15' },
        { id: 'wf-2', type: 'backtest', status: 'completed', symbol: 'AKBNK', steps: [], currentStep: 'done', progress: 100, createdAt: '2025-01-15' },
      ],
    } as never);
    render(<TabWorkflow data={mockAnalysisResult} />);
    await waitFor(() => {
      expect(screen.queryByText('AKBNK')).not.toBeInTheDocument();
    });
  });

  it('shows workflow step progress', async () => {
    const sdk = await import('@/lib/sdk');
    vi.mocked(sdk.sdkClient.workflows).mockResolvedValueOnce({
      data: [
        {
          id: 'wf-1',
          type: 'backtest',
          status: 'completed',
          symbol: 'GARAN',
          steps: [
            { step: 'validate', status: 'completed', durationMs: 50 },
            { step: 'run', status: 'completed', durationMs: 200 },
          ],
          currentStep: 'done',
          progress: 100,
          durationMs: 3000,
          createdAt: '2025-01-15',
        },
      ],
    } as never);
    render(<TabWorkflow data={mockAnalysisResult} />);
    await waitFor(() => {
      expect(screen.getByText('validate')).toBeInTheDocument();
    });
    expect(screen.getByText('run')).toBeInTheDocument();
    expect(screen.getByText('50ms')).toBeInTheDocument();
    expect(screen.getByText('200ms')).toBeInTheDocument();
  });
});
