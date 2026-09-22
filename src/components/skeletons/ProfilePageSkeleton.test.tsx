import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ProfilePageSkeleton from "./ProfilePageSkeleton";

describe("ProfilePageSkeleton", () => {
  it("renders the placeholder post grid with 9 tiles", () => {
    const { container } = render(<ProfilePageSkeleton />);
    expect(container.querySelectorAll(".aspect-square").length).toBe(9);
  });
});
