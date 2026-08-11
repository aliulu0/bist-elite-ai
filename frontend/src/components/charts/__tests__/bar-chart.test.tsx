import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BarChart } from "../bar-chart";

describe("BarChart", () => {
  const data = [
    { label: "A", value: 100 },
    { label: "B", value: 200 },
    { label: "C", value: 150 },
  ];

  it("renders without crashing", () => {
    const { container } = render(<BarChart data={data} />);
    expect(container.querySelector(".recharts-wrapper")).toBeTruthy();
  });
});
