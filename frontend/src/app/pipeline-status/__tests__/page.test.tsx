import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PipelineStatusPage from "../page";

vi.mock("@/hooks/use-dashboard", () => ({
  usePipelineStatus: () => ({
    data: {
      metrics: {
        pipelineDurationMs: 12345,
        providerAvgLatencyMs: 500,
        macroRefreshDurationMs: 1500,
        schedulerDurationMs: 200,
        providerFailures: 0,
        circuitBreakerStatus: {},
        macroUpdateTimestamp: "2025-01-01T12:00:00.000Z",
        dashboardRefreshMs: 300,
      },
      stepDurations: {
        fetch_market_data: 2000,
        normalize: 500,
        aggregate: 300,
        ai_analysis: 5000,
        opportunity_detection: 1000,
        scanner: 800,
        ranking: 600,
        alerts: 200,
        portfolio_refresh: 400,
        macro_refresh: 1500,
      },
    },
    isLoading: false,
  }),
  useRunPipeline: () => ({ mutate: vi.fn(), isPending: false }),
  useResetPipeline: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/components/layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components", () => ({
  PageHeader: () => null,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("PipelineStatusPage", () => {
  it("renders pipeline duration in seconds", () => {
    render(<PipelineStatusPage />, { wrapper });
    expect(screen.getByText("12.3s")).toBeTruthy();
  });

  it("renders provider failures count", () => {
    render(<PipelineStatusPage />, { wrapper });
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("renders macro refresh card", () => {
    render(<PipelineStatusPage />, { wrapper });
    expect(screen.getByText(/Macro Refresh/)).toBeTruthy();
  });

  it("renders step duration bars", () => {
    render(<PipelineStatusPage />, { wrapper });
    expect(screen.getByText("fetch market data")).toBeTruthy();
    expect(screen.getByText("ai analysis")).toBeTruthy();
  });

  it("renders run and reset buttons", () => {
    render(<PipelineStatusPage />, { wrapper });
    expect(screen.getByText("Run Pipeline")).toBeTruthy();
    expect(screen.getByText("Reset Metrics")).toBeTruthy();
  });
});
