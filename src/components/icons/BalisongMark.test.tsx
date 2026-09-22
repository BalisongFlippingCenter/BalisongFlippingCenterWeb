import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import BalisongMark from "./BalisongMark";

describe("BalisongMark", () => {
  it("renders an svg using currentColor and black by default", () => {
    const { container } = render(<BalisongMark />);
    const svg = container.querySelector("svg")!;
    expect(svg).toBeInTheDocument();
    expect(container.querySelectorAll('path[fill="currentColor"]').length).toBeGreaterThan(0);
    expect(container.querySelector('circle[fill="black"]')).toBeInTheDocument();
  });

  it("applies custom fill, pupilFill, and className props", () => {
    const { container } = render(<BalisongMark className="my-icon" fill="#fff" pupilFill="#000" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveClass("my-icon");
    expect(container.querySelectorAll('path[fill="#fff"]').length).toBeGreaterThan(0);
    expect(container.querySelector('circle[fill="#000"]')).toBeInTheDocument();
  });
});
