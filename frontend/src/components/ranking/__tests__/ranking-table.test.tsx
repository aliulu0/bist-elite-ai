import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RankingTable } from "../ranking-table";

vi.mock("@/hooks/use-dashboard", () => ({
  useRanking: () => ({
    data: {
      items: [
        { rank: 1, symbol: "GARAN", name: "Garanti BBVA", score: 92.5, confidence: 85, investmentGrade: "AAA", recommendation: "STRONG_BUY", risk: 25, trend: "UP", sector: "Banking", price: 120.5, changePercent: 3.2, freshness: 100 },
        { rank: 2, symbol: "AKBNK", name: "Akbank", score: 88.3, confidence: 80, investmentGrade: "AA", recommendation: "BUY", risk: 30, trend: "UP", sector: "Banking", price: 85.4, changePercent: 2.1, freshness: 100 },
      ],
      total: 2,
      page: 1,
      pageSize: 50,
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

describe("RankingTable", () => {
  it("renders stock symbols", () => {
    render(<RankingTable />, { wrapper });
    expect(screen.getByText("GARAN")).toBeTruthy();
    expect(screen.getByText("AKBNK")).toBeTruthy();
  });

  it("renders scores", () => {
    render(<RankingTable />, { wrapper });
    expect(screen.getByText("92.5")).toBeTruthy();
    expect(screen.getByText("88.3")).toBeTruthy();
  });

  it("renders investment grades", () => {
    render(<RankingTable />, { wrapper });
    expect(screen.getByText("AAA")).toBeTruthy();
    expect(screen.getByText("AA")).toBeTruthy();
  });
});
