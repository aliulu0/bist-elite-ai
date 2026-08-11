import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MacroIntelligencePage from "../page";

const mockFullAnalysis = {
  data: {
    points: [],
    fetchedAt: "2025-01-01T00:00:00.000Z",
    sourceCount: 6,
    healthyCount: 5,
    staleCount: 1,
    errorCount: 0,
  },
  tcmb: {
    bank: "tcmb",
    tone: "hawkish",
    confidence: 0.85,
    marketImpact: "negative",
    sectorImpacts: {},
    liquidity: "tight",
    risk: "high",
    summary: "TCMB kept rates steady",
    analyzedAt: "2025-01-01T00:00:00.000Z",
  },
  fed: {
    bank: "fed",
    tone: "dovish",
    confidence: 0.75,
    marketImpact: "positive",
    sectorImpacts: {},
    liquidity: "loose",
    risk: "low",
    summary: "FED signaled rate cuts",
    analyzedAt: "2025-01-01T00:00:00.000Z",
  },
  ecb: {
    bank: "ecb",
    tone: "neutral",
    confidence: 0.6,
    marketImpact: "neutral",
    sectorImpacts: {},
    liquidity: "neutral",
    risk: "moderate",
    summary: "ECB held rates",
    analyzedAt: "2025-01-01T00:00:00.000Z",
  },
  regime: {
    regime: "risk_off",
    score: 35,
    components: {
      vix: { value: 28, impact: 0.7 },
      dxy: { value: 104, impact: 0.4 },
      us10y: { value: 4.5, impact: 0.3 },
      cds: { value: 350, impact: 0.8 },
      liquidity: { value: 45, impact: 0.6 },
      momentum: { value: -0.2, impact: 0.5 },
    },
    signals: ["Elevated VIX above 25", "CDS above 300 bps"],
    analyzedAt: "2025-01-01T00:00:00.000Z",
  },
  score: {
    macroScore: 62,
    components: {
      monetaryPolicy: 55,
      globalRisk: 48,
      domesticRisk: 40,
      growth: 75,
      liquidity: 65,
    },
    confidence: 80,
    calculatedAt: "2025-01-01T00:00:00.000Z",
  },
  sectors: [
    { sector: "Banking", impact: "positive", score: 78, drivers: ["Rate cuts"] },
    { sector: "Industrial", impact: "neutral", score: 52, drivers: ["PMI stable"] },
    { sector: "Retail", impact: "negative", score: 32, drivers: ["Weak demand"] },
  ],
};

vi.mock("@/hooks/use-dashboard", () => ({
  useMacroFullAnalysis: () => ({
    data: mockFullAnalysis,
    isLoading: false,
  }),
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

describe("MacroIntelligencePage", () => {
  it("renders macro score value", () => {
    render(<MacroIntelligencePage />, { wrapper });
    expect(screen.getByText("62")).toBeTruthy();
  });

  it("renders market regime", () => {
    render(<MacroIntelligencePage />, { wrapper });
    expect(screen.getByText("RISK OFF")).toBeTruthy();
  });

  it("renders central bank tones", () => {
    render(<MacroIntelligencePage />, { wrapper });
    expect(screen.getByText("hawkish")).toBeTruthy();
    expect(screen.getByText("dovish")).toBeTruthy();
  });

  it("renders sector impacts", () => {
    render(<MacroIntelligencePage />, { wrapper });
    expect(screen.getByText("Banking")).toBeTruthy();
    expect(screen.getByText("POSITIVE")).toBeTruthy();
  });
});
