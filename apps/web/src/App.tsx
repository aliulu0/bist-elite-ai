import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { NotificationToast } from '@/components/shared';
import { AppLayout } from '@/components/layout/app-layout';
import { RealtimeProvider } from '@/components/realtime/realtime-provider';
import { Loader2 } from 'lucide-react';

const DashboardPage = lazy(() => import('./pages/dashboard'));
const ScannerPage = lazy(() => import('./pages/scanner'));
const DailyScanPage = lazy(() => import('./pages/daily-scan'));
const RadarPage = lazy(() => import('./pages/radar'));
const RadarDetailPage = lazy(() => import('./pages/radar-detail'));
const SignalsPage = lazy(() => import('./pages/signals'));
const StockPage = lazy(() => import('./pages/stock'));
const BISTMarketIntelligencePage = lazy(() => import('./pages/bist-market-intelligence'));
const AnalysisPage = lazy(() => import('./pages/analysis'));
const BacktestPage = lazy(() => import('./pages/backtest'));
const PortfolioPage = lazy(() => import('./pages/portfolio'));
const WatchlistPage = lazy(() => import('./pages/watchlist'));
const AlertsPage = lazy(() => import('./pages/alerts'));
const TelegramPage = lazy(() => import('./pages/telegram'));
const WorkflowsPage = lazy(() => import('./pages/workflows'));
const PipelineStatusPage = lazy(() => import('./pages/pipeline-status'));
const ConfigurationPage = lazy(() => import('./pages/configuration'));
const PerformancePage = lazy(() => import('./pages/performance'));
const ProvidersPage = lazy(() => import('./pages/providers'));
const EventsPage = lazy(() => import('./pages/events'));
const DiagnosticsPage = lazy(() => import('./pages/diagnostics'));
const AuditPage = lazy(() => import('./pages/audit'));
const SettingsPage = lazy(() => import('./pages/settings'));
const AiAssistantPage = lazy(() => import('./pages/ai-assistant'));
const AiReportsPage = lazy(() => import('./pages/ai-reports'));
const ResearchIntelligencePage = lazy(() => import('./pages/research-intelligence'));
const HistoryPage = lazy(() => import('./pages/history'));
const NotFoundPage = lazy(() =>
  import('./pages/not-found').then((m) => ({ default: m.NotFoundPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});

function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/scanner" element={<ScannerPage />} />
                  <Route path="/daily-scan" element={<DailyScanPage />} />
                  <Route path="/radar" element={<RadarPage />} />
                  <Route path="/radar/:ticker" element={<RadarDetailPage />} />
                  <Route path="/signals" element={<SignalsPage />} />
                  <Route path="/stock/:ticker" element={<StockPage />} />
                  <Route
                    path="/bist-market-intelligence"
                    element={<BISTMarketIntelligencePage />}
                  />
                  <Route path="/analysis" element={<AnalysisPage />} />
                  <Route path="/backtest" element={<BacktestPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/telegram" element={<TelegramPage />} />
                  <Route path="/workflows" element={<WorkflowsPage />} />
                  <Route path="/pipeline-status" element={<PipelineStatusPage />} />
                  <Route path="/configuration" element={<ConfigurationPage />} />
                  <Route path="/performance" element={<PerformancePage />} />
                  <Route path="/providers" element={<ProvidersPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/diagnostics" element={<DiagnosticsPage />} />
                  <Route path="/audit" element={<AuditPage />} />
                  <Route path="/ai-assistant" element={<AiAssistantPage />} />
                  <Route path="/ai-reports" element={<AiReportsPage />} />
                  <Route path="/research-intelligence" element={<ResearchIntelligencePage />} />
                  <Route path="/market-data-history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </RealtimeProvider>
        <NotificationToast />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
