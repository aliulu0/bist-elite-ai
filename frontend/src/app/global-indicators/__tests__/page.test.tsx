import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GlobalIndicatorsPage from "../page";

const mockData = {
  points: [
    { source: "vix", label: "VIX", value: 22, previousValue: 20, change: 2, changePercent: 10, unit: "", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "dxy", label: "DXY", value: 104, previousValue: 103, change: 1, changePercent: 0.97, unit: "", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "gold", label: "Gold", value: 1950, previousValue: 1930, change: 20, changePercent: 1.04, unit: "USD", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "brent", label: "Brent Oil", value: 82, previousValue: 80, change: 2, changePercent: 2.5, unit: "USD", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "usdtry", label: "USD/TRY", value: 30.5, previousValue: 30.2, change: 0.3, changePercent: 0.99, unit: "", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "eurusd", label: "EUR/USD", value: 1.08, previousValue: 1.07, change: 0.01, changePercent: 0.93, unit: "", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "turkey_cds", label: "Turkey CDS", value: 350, previousValue: 340, change: 10, changePercent: 2.94, unit: "bps", timestamp: "2025-01-01T00:00:00.000Z", status: "stale" },
    { source: "inflation", label: "CPI", value: 2.5, previousValue: 2.4, change: 0.1, changePercent: 4.17, unit: "%", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "pmi", label: "PMI", value: 51, previousValue: 50, change: 1, changePercent: 2, unit: "", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "us10y", label: "US 10Y", value: 4.5, previousValue: 4.4, change: 0.1, changePercent: 2.27, unit: "%", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
  ],
  fetchedAt: "2025-01-01T12:00:00.000Z",
  sourceCount: 10,
  healthyCount: 9,
  staleCount: 1,
  errorCount: 0,
};

vi.mock("@/hooks/use-dashboard", () => ({
  useMacroData: () => ({
    data: mockData,
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

describe("GlobalIndicatorsPage", () => {
  it("renders category labels", () => {
    render(<GlobalIndicatorsPage />, { wrapper });
    expect(screen.getByText("Risk Indicators")).toBeTruthy();
    expect(screen.getByText("Commodities")).toBeTruthy();
    expect(screen.getByText("Currency")).toBeTruthy();
    expect(screen.getByText("Macro Data")).toBeTruthy();
  });

  it("renders source count", () => {
    render(<GlobalIndicatorsPage />, { wrapper });
    expect(screen.getByText(/9\/10/)).toBeTruthy();
  });

  it("renders indicator values", () => {
    render(<GlobalIndicatorsPage />, { wrapper });
    expect(screen.getByText(/1950/)).toBeTruthy();
    expect(screen.getByText(/30.5/)).toBeTruthy();
  });

  it("renders indicator labels", () => {
    render(<GlobalIndicatorsPage />, { wrapper });
    expect(screen.getByText("VIX")).toBeTruthy();
    expect(screen.getByText("Gold")).toBeTruthy();
    expect(screen.getByText("Brent Oil")).toBeTruthy();
    expect(screen.getByText("Turkey CDS")).toBeTruthy();
  });
});
