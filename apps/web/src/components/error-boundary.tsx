import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md rounded-lg border border-destructive/20 bg-card p-8 text-center shadow-lg">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="mb-2 text-lg font-bold">Bir hata oluştu</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              Uygulama beklenmeyen bir hata ile karşılaştı. Lütfen sayfayı yenileyin veya tekrar deneyin.
            </p>
            {this.state.error && (
              <pre className="mb-4 overflow-x-auto rounded-md bg-muted p-3 text-left text-xs">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
