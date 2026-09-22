import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import FeedPostCardSkeleton from "./FeedPostCardSkeleton";

describe("FeedPostCardSkeleton", () => {
  it("uses the feed rounding by default", () => {
    const { container } = render(<FeedPostCardSkeleton />);
    expect(container.firstChild).toHaveClass("lg:rounded-2xl");
  });

  it("uses the page rounding when variant is 'page'", () => {
    const { container } = render(<FeedPostCardSkeleton variant="page" />);
    expect(container.firstChild).toHaveClass("lg:rounded-t-2xl");
  });
});
