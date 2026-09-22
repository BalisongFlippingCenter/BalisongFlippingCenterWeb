import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import TimeoutBar from "./TimeoutBar";

describe("TimeoutBar", () => {
  it("sets its width style from the percentage prop", () => {
    const { container } = render(<TimeoutBar percentage={42} />);
    expect((container.firstChild as HTMLElement)).toHaveStyle({ width: "42%" });
  });

  it("renders 0% and 100% correctly", () => {
    const { container, rerender } = render(<TimeoutBar percentage={0} />);
    expect((container.firstChild as HTMLElement)).toHaveStyle({ width: "0%" });

    rerender(<TimeoutBar percentage={100} />);
    expect((container.firstChild as HTMLElement)).toHaveStyle({ width: "100%" });
  });
});
