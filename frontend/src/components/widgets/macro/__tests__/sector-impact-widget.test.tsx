import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectorImpactWidget } from "../sector-impact-widget";

const mockSectors = [
  { sector: "Banking", impact: "positive" as const, score: 78, drivers: ["Rate cuts"] },
  { sector: "Industrial", impact: "neutral" as const, score: 52, drivers: ["PMI stable"] },
  { sector: "Retail", impact: "negative" as const, score: 32, drivers: ["Weak demand"] },
];

describe("SectorImpactWidget", () => {
  it("renders sector names", () => {
    render(<SectorImpactWidget sectors={mockSectors} isLoading={false} />);
    expect(screen.getByText("Banking")).toBeTruthy();
    expect(screen.getByText("Industrial")).toBeTruthy();
    expect(screen.getByText("Retail")).toBeTruthy();
  });

  it("renders impact labels", () => {
    render(<SectorImpactWidget sectors={mockSectors} isLoading={false} />);
    expect(screen.getByText("POSITIVE")).toBeTruthy();
    expect(screen.getByText("NEGATIVE")).toBeTruthy();
  });

  it("renders scores", () => {
    render(<SectorImpactWidget sectors={mockSectors} isLoading={false} />);
    expect(screen.getByText("78/100")).toBeTruthy();
    expect(screen.getByText("32/100")).toBeTruthy();
  });

  it("shows loading state", () => {
    render(<SectorImpactWidget isLoading={true} />);
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });
});
