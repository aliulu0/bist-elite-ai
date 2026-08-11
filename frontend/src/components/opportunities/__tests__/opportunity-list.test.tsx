import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OpportunityList } from "../opportunity-list";

vi.mock("@/hooks/use-dashboard", () => ({
  useOpportunities: () => ({
    data: [
      { id: "1", symbol: "GARAN", name: "Garanti BBVA", confidence: 85, score: 90, reasons: ["Strong fundamentals", "Undervalued"], strengths: ["High ROE", "Low P/E"], weaknesses: ["Sector concentration"], type: "VALUE", detectedAt: "2025-01-01" },
    ],
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

describe("OpportunityList", () => {
  it("renders opportunity symbols", () => {
    render(<OpportunityList />, { wrapper });
    expect(screen.getByText("GARAN")).toBeTruthy();
  });

  it("renders reasons", () => {
    render(<OpportunityList />, { wrapper });
    expect(screen.getByText(/Strong fundamentals/)).toBeTruthy();
  });

  it("renders confidence badge", () => {
    render(<OpportunityList />, { wrapper });
    expect(screen.getByText("85% Confidence")).toBeTruthy();
  });
});
