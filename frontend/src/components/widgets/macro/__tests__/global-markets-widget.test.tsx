import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlobalMarketsWidget } from "../global-markets-widget";

const mockData = {
  points: [
    { source: "vix", label: "VIX", value: 22, previousValue: 20, change: 2, changePercent: 10, unit: "", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "dxy", label: "DXY", value: 104, previousValue: 103, change: 1, changePercent: 0.97, unit: "", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "gold", label: "Gold", value: 1950, previousValue: 1930, change: 20, changePercent: 1.04, unit: "USD", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
    { source: "usdtry", label: "USD/TRY", value: 30.5, previousValue: 30.2, change: 0.3, changePercent: 0.99, unit: "", timestamp: "2025-01-01T00:00:00.000Z", status: "fetched" },
  ],
  fetchedAt: "2025-01-01T00:00:00.000Z",
  sourceCount: 4,
  healthyCount: 4,
  staleCount: 0,
  errorCount: 0,
};

describe("GlobalMarketsWidget", () => {
  it("renders key market labels", () => {
    render(<GlobalMarketsWidget data={mockData} isLoading={false} />);
    expect(screen.getByText("VIX")).toBeTruthy();
    expect(screen.getByText("DXY")).toBeTruthy();
    expect(screen.getByText("Gold")).toBeTruthy();
    expect(screen.getByText("USD/TRY")).toBeTruthy();
  });

  it("renders values with units", () => {
    render(<GlobalMarketsWidget data={mockData} isLoading={false} />);
    expect(screen.getByText(/1950/)).toBeTruthy();
    expect(screen.getAllByText(/USD/).length).toBeGreaterThan(0);
  });

  it("shows loading state", () => {
    render(<GlobalMarketsWidget isLoading={true} />);
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });
});
