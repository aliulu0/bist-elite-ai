import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LineChart } from "../line-chart";

describe("LineChart", () => {
  const data = [
    { label: "Jan", value: 100 },
    { label: "Feb", value: 200 },
    { label: "Mar", value: 150 },
  ];

  it("renders without crashing", () => {
    const { container } = render(<LineChart data={data} />);
    expect(container.querySelector(".recharts-wrapper")).toBeTruthy();
  });

  it("renders with custom height", () => {
    const { container } = render(<LineChart data={data} height={400} />);
    const wrapper = container.querySelector(".recharts-wrapper");
    expect(wrapper).toBeTruthy();
  });

  it("renders without grid", () => {
    const { container } = render(<LineChart data={data} showGrid={false} />);
    expect(container.querySelector(".recharts-cartesian-grid")).toBeFalsy();
  });
});
