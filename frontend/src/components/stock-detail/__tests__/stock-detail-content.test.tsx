import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StockDetailContent } from "../stock-detail-content";

vi.mock("@/hooks/use-dashboard", () => ({
  useStockDetail: () => ({
    data: {
      symbol: "GARAN", name: "Garanti BBVA", sector: "Banking", industry: "Finance",
      price: 120.5, change: 3.8, changePercent: 3.2, volume: 5000000, marketCap: 50000000000,
      ranking: null,
      aiAnalysis: { summary: "Strong bank with good fundamentals", strengths: ["High ROE"], weaknesses: ["Sector risk"], opportunities: ["Digital growth"], threats: ["Regulation"] },
      financialSummary: { pe: 8.5, pb: 1.2, dividendYield: 2.5, revenue: 100000000000, profit: 25000000000, debtToEquity: 1.5, roe: 18 },
      technicalSummary: { rsi: 55, macd: "Bullish", sma20: 118, sma50: 115, sma200: 110, trend: "UP" },
      opportunityHistory: [],
      alertHistory: [],
      portfolioPosition: { hasPosition: true, quantity: 500, averageCost: 110, currentValue: 60250, profitLoss: 5250, profitLossPercent: 9.5 },
    },
    isLoading: false,
  }),
  useRankedStock: () => ({
    data: { rank: 1, symbol: "GARAN", name: "Garanti BBVA", score: 92.5, confidence: 85, investmentGrade: "AAA", recommendation: "STRONG_BUY", risk: 25, trend: "UP", sector: "Banking", price: 120.5, changePercent: 3.2, freshness: 100 },
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

describe("StockDetailContent", () => {
  it("renders stock symbol", () => {
    render(<StockDetailContent symbol="GARAN" />, { wrapper });
    expect(screen.getByText("GARAN")).toBeTruthy();
  });

  it("renders company name", () => {
    render(<StockDetailContent symbol="GARAN" />, { wrapper });
    expect(screen.getByText("Garanti BBVA")).toBeTruthy();
  });

  it("renders price", () => {
    render(<StockDetailContent symbol="GARAN" />, { wrapper });
    expect(screen.getByText("120,50")).toBeTruthy();
  });

  it("renders ranking info", () => {
    render(<StockDetailContent symbol="GARAN" />, { wrapper });
    expect(screen.getByText(/Rank #1/)).toBeTruthy();
  });
});
