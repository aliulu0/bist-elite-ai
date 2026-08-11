import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketRegimeWidget } from "../market-regime-widget";

const mockRegime = {
  regime: "risk_off" as const,
  score: 35,
  components: {
    vix: { value: 28, impact: 0.7 },
    dxy: { value: 104, impact: 0.4 },
    us10y: { value: 4.5, impact: 0.3 },
    cds: { value: 350, impact: 0.8 },
    liquidity: { value: 45, impact: 0.6 },
    momentum: { value: -0.2, impact: 0.5 },
  },
  signals: ["Elevated VIX above 25", "CDS above 300 bps", "DXY strengthening"],
  analyzedAt: "2025-01-01T00:00:00.000Z",
};

describe("MarketRegimeWidget", () => {
  it("renders regime label", () => {
    render(<MarketRegimeWidget regime={mockRegime} isLoading={false} />);
    expect(screen.getByText("RISK OFF")).toBeTruthy();
  });

  it("renders score", () => {
    render(<MarketRegimeWidget regime={mockRegime} isLoading={false} />);
    expect(screen.getByText("Score: 35/100")).toBeTruthy();
  });

  it("renders signals", () => {
    render(<MarketRegimeWidget regime={mockRegime} isLoading={false} />);
    expect(screen.getByText("Elevated VIX above 25")).toBeTruthy();
    expect(screen.getByText("CDS above 300 bps")).toBeTruthy();
  });

  it("shows loading state", () => {
    render(<MarketRegimeWidget isLoading={true} />);
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });
});
