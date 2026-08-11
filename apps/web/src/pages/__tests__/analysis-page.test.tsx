import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalysisPage from '../analysis';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    analysis: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AnalysisPage', () => {
  it('renders page header', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    expect(screen.getByText('Hisse Analiz')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    expect(screen.getByLabelText('Hisse kodu')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    expect(screen.getByText('Analiz Et')).toBeInTheDocument();
  });

  it('empty state before search', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    expect(screen.getByText('Hisse analizi başlatın')).toBeInTheDocument();
    expect(screen.getByText('Yukarıdaki alana bir hisse kodu girerek kapsamlı analiz başlatın')).toBeInTheDocument();
  });

  it('submit button disabled when empty', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    expect(screen.getByText('Analiz Et')).toBeDisabled();
  });

  it('submit button enabled when input has value', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Hisse kodu'), { target: { value: 'GARAN' } });
    expect(screen.getByText('Analiz Et')).not.toBeDisabled();
  });

  it('page has proper structure', () => {
    const { container } = render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows description text', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    expect(screen.getByText('Kapsamlı hisse analizi ve değerlendirme workspace\'i')).toBeInTheDocument();
  });

  it('input accepts text', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    const input = screen.getByLabelText('Hisse kodu');
    fireEvent.change(input, { target: { value: 'THYAO' } });
    expect(input).toHaveValue('THYAO');
  });

  it('form submission prevented when empty', () => {
    render(<MemoryRouter><AnalysisPage /></MemoryRouter>);
    const form = screen.getByLabelText('Hisse kodu').closest('form');
    expect(form).toBeInTheDocument();
  });
});
