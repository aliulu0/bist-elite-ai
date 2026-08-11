import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PieChart } from "../pie-chart";

describe("PieChart", () => {
  const data = [
    { name: "Tech", value: 50 },
    { name: "Finance", value: 30 },
    { name: "Health", value: 20 },
  ];

  it("renders without crashing", () => {
    const { container } = render(<PieChart data={data} />);
    expect(container.querySelector(".recharts-wrapper")).toBeTruthy();
  });

  it("renders with legend", () => {
    const { container } = render(<PieChart data={data} showLegend />);
    expect(container.querySelector(".recharts-legend-wrapper")).toBeTruthy();
  });
});
