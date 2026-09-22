import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import TutorialCenterPageBackground from "./TutorialCenterPageBackground";

describe("TutorialCenterPageBackground", () => {
  it("renders a non-interactive full-bleed background layer", () => {
    const { container } = render(<TutorialCenterPageBackground />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("pointer-events-none");
    expect(root.children.length).toBe(2);
  });
});
