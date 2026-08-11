import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveAlertsWidget } from "../active-alerts-widget";

vi.mock("@/hooks/use-dashboard", () => ({
  useAlerts: () => ({
    data: [
      { id: "1", type: "PRICE", symbol: "GARAN", message: "Price target reached", priority: "HIGH", status: "ACTIVE", createdAt: "2025-01-01T00:00:00.000Z" },
      { id: "2", type: "VOLUME", symbol: "AKBNK", message: "Unusual volume spike", priority: "MEDIUM", status: "ACTIVE", createdAt: "2025-01-01T00:00:00.000Z" },
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

describe("ActiveAlertsWidget", () => {
  it("renders active alerts", () => {
    render(<ActiveAlertsWidget />, { wrapper });
    expect(screen.getByText("GARAN")).toBeTruthy();
    expect(screen.getByText("AKBNK")).toBeTruthy();
  });

  it("renders priority badges", () => {
    render(<ActiveAlertsWidget />, { wrapper });
    expect(screen.getByText("HIGH")).toBeTruthy();
    expect(screen.getByText("MEDIUM")).toBeTruthy();
  });
});
