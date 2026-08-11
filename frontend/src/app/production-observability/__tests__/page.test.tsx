import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductionObservabilityPage from "../page";

vi.mock("@/hooks/use-dashboard", () => ({
  usePipelineMetrics: () => ({
    data: {
      pipelineDurationMs: 10000,
      providerAvgLatencyMs: 200,
      macroRefreshDurationMs: 1000,
      schedulerDurationMs: 150,
      providerFailures: 0,
      circuitBreakerStatus: {},
      macroUpdateTimestamp: "2025-01-01T12:00:00.000Z",
      dashboardRefreshMs: 250,
    },
    isLoading: false,
  }),
  useMacroScore: () => ({
    data: {
      macroScore: 68,
      components: { monetaryPolicy: 60, globalRisk: 55, domesticRisk: 45, growth: 78, liquidity: 70 },
      confidence: 82,
      calculatedAt: "2025-01-01T00:00:00.000Z",
    },
    isLoading: false,
  }),
  useMacroData: () => ({
    data: {
      points: [],
      fetchedAt: "2025-01-01T00:00:00.000Z",
      sourceCount: 12,
      healthyCount: 10,
      staleCount: 1,
      errorCount: 1,
    },
    isLoading: false,
  }),
  useMarketRegime: () => ({
    data: {
      regime: "risk_off",
      score: 30,
      components: {
        vix: { value: 28, impact: 0.7 },
        dxy: { value: 104, impact: 0.4 },
        us10y: { value: 4.5, impact: 0.3 },
        cds: { value: 350, impact: 0.8 },
        liquidity: { value: 45, impact: 0.6 },
        momentum: { value: -0.2, impact: 0.5 },
      },
      signals: ["Elevated VIX"],
      analyzedAt: "2025-01-01T00:00:00.000Z",
    },
    isLoading: false,
  }),
  useMacroAlerts: () => ({
    data: [
      { id: "1", type: "macro_alert", title: "Test Alert", message: "Test", severity: "warning", source: "vix", timestamp: "2025-01-01T00:00:00.000Z" },
    ],
    isLoading: false,
  }),
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

describe("ProductionObservabilityPage", () => {
  it("renders pipeline health duration", () => {
    render(<ProductionObservabilityPage />, { wrapper });
    expect(screen.getByText("10.0s")).toBeTruthy();
  });

  it("renders macro score", () => {
    render(<ProductionObservabilityPage />, { wrapper });
    expect(screen.getByText("68")).toBeTruthy();
  });

  it("renders market regime", () => {
    render(<ProductionObservabilityPage />, { wrapper });
    expect(screen.getByText("RISK OFF")).toBeTruthy();
  });

  it("renders data source counts", () => {
    render(<ProductionObservabilityPage />, { wrapper });
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("renders active alert count", () => {
    render(<ProductionObservabilityPage />, { wrapper });
    expect(screen.getByText("Macro alerts currently active")).toBeTruthy();
  });

  it("renders system status indicators", () => {
    render(<ProductionObservabilityPage />, { wrapper });
    expect(screen.getByText("Pipeline Service")).toBeTruthy();
    expect(screen.getByText("Macro Engine")).toBeTruthy();
    expect(screen.getByText("Data Providers")).toBeTruthy();
  });
});
