import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskAppetiteWidget } from "../risk-appetite-widget";

const mockRegime = {
  regime: "risk_on" as const,
  score: 85,
  components: {
    vix: { value: 12, impact: 0.2 },
    dxy: { value: 100, impact: 0.3 },
    us10y: { value: 3.8, impact: 0.2 },
    cds: { value: 180, impact: 0.3 },
    liquidity: { value: 75, impact: 0.2 },
    momentum: { value: 0.5, impact: 0.3 },
  },
  signals: ["Low volatility", "Strong momentum"],
  analyzedAt: "2025-01-01T00:00:00.000Z",
};

describe("RiskAppetiteWidget", () => {
  it("renders risk level for risk_on", () => {
    render(<RiskAppetiteWidget regime={mockRegime} isLoading={false} />);
    expect(screen.getByText("High")).toBeTruthy();
  });

  it("renders description", () => {
    render(<RiskAppetiteWidget regime={mockRegime} isLoading={false} />);
    expect(screen.getByText("Based on VIX, DXY, CDS, yields")).toBeTruthy();
  });

  it("shows loading state", () => {
    render(<RiskAppetiteWidget isLoading={true} />);
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("renders Moderate for neutral regime", () => {
    const neutralRegime = { ...mockRegime, regime: "neutral" as const };
    render(<RiskAppetiteWidget regime={neutralRegime} isLoading={false} />);
    expect(screen.getByText("Moderate")).toBeTruthy();
  });
});
