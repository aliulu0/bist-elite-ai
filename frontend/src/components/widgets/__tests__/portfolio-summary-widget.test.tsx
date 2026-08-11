import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortfolioSummaryWidget } from "../portfolio-summary-widget";

vi.mock("@/hooks/use-dashboard", () => ({
  usePortfolioSummary: () => ({
    data: {
      totalValue: 150000,
      cash: 25000,
      investedCapital: 100000,
      marketValue: 125000,
      totalProfitLoss: 25000,
      totalProfitLossPercent: 25,
      positionCount: 12,
      cashAllocation: 16.67,
      stockAllocation: 83.33,
    },
    isLoading: false,
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("PortfolioSummaryWidget", () => {
  it("renders portfolio value", () => {
    render(<PortfolioSummaryWidget />, { wrapper });
    expect(screen.getByText(/150.000/)).toBeTruthy();
  });

  it("renders cash amount", () => {
    render(<PortfolioSummaryWidget />, { wrapper });
    expect(screen.getByText(/25.000/)).toBeTruthy();
  });

  it("renders position count", () => {
    render(<PortfolioSummaryWidget />, { wrapper });
    expect(screen.getByText("12")).toBeTruthy();
  });
});
