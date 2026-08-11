import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MacroScoreWidget } from "../macro-score-widget";

const mockScore = {
  macroScore: 72,
  components: {
    monetaryPolicy: 65,
    globalRisk: 58,
    domesticRisk: 45,
    growth: 80,
    liquidity: 70,
  },
  confidence: 85,
  calculatedAt: "2025-01-01T00:00:00.000Z",
};

describe("MacroScoreWidget", () => {
  it("renders macro score value", () => {
    render(<MacroScoreWidget score={mockScore} isLoading={false} />);
    expect(screen.getByText("72")).toBeTruthy();
  });

  it("renders confidence percentage", () => {
    render(<MacroScoreWidget score={mockScore} isLoading={false} />);
    expect(screen.getByText("Confidence: 85%")).toBeTruthy();
  });

  it("renders component scores", () => {
    render(<MacroScoreWidget score={mockScore} isLoading={false} />);
    expect(screen.getByText("65")).toBeTruthy();
    expect(screen.getByText("58")).toBeTruthy();
    expect(screen.getByText("80")).toBeTruthy();
  });

  it("shows loading state", () => {
    render(<MacroScoreWidget isLoading={true} />);
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows no data when score is undefined and not loading", () => {
    render(<MacroScoreWidget isLoading={false} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });
});
