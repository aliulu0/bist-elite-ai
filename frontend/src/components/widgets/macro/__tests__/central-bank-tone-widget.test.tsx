import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CentralBankToneWidget } from "../central-bank-tone-widget";

const mockTcmb = {
  bank: "tcmb" as const,
  tone: "hawkish" as const,
  confidence: 0.85,
  marketImpact: "negative" as const,
  sectorImpacts: {},
  liquidity: "tight" as const,
  risk: "high" as const,
  summary: "TCMB kept rates steady",
  analyzedAt: "2025-01-01T00:00:00.000Z",
};

const mockFed = {
  bank: "fed" as const,
  tone: "dovish" as const,
  confidence: 0.75,
  marketImpact: "positive" as const,
  sectorImpacts: {},
  liquidity: "loose" as const,
  risk: "low" as const,
  summary: "FED signaled rate cuts",
  analyzedAt: "2025-01-01T00:00:00.000Z",
};

describe("CentralBankToneWidget", () => {
  it("renders bank names", () => {
    render(<CentralBankToneWidget tcmb={mockTcmb} fed={mockFed} ecb={undefined} isLoading={false} />);
    expect(screen.getByText("TCMB")).toBeTruthy();
    expect(screen.getByText("FED")).toBeTruthy();
    expect(screen.getByText("ECB")).toBeTruthy();
  });

  it("renders tone labels", () => {
    render(<CentralBankToneWidget tcmb={mockTcmb} fed={mockFed} ecb={undefined} isLoading={false} />);
    expect(screen.getByText("hawkish")).toBeTruthy();
    expect(screen.getByText("dovish")).toBeTruthy();
  });

  it("shows unknown for missing ECB data", () => {
    render(<CentralBankToneWidget tcmb={mockTcmb} fed={mockFed} ecb={undefined} isLoading={false} />);
    expect(screen.getByText("unknown")).toBeTruthy();
  });

  it("shows loading state", () => {
    render(<CentralBankToneWidget isLoading={true} />);
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });
});
