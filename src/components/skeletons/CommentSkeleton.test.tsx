import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import CommentSkeleton from "./CommentSkeleton";

describe("CommentSkeleton", () => {
  it("renders without the reply indent by default", () => {
    const { container } = render(<CommentSkeleton />);
    expect(container.firstChild).not.toHaveClass("ml-9");
  });

  it("renders with the reply indent when depth > 0", () => {
    const { container } = render(<CommentSkeleton depth={1} />);
    expect(container.firstChild).toHaveClass("ml-9");
  });
});
