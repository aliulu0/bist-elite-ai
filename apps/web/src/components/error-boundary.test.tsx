import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

function ThrowingComponent() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children normally', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('catches errors and shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Bir hata oluştu')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Sayfayı Yenile')).toBeInTheDocument();
  });
});
