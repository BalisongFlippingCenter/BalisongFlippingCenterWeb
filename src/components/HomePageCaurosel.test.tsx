import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import HomePageCaurosel from "./HomePageCaurosel";

describe("HomePageCaurosel", () => {
  it("renders an autoplaying, muted, looping background video", () => {
    const { container } = render(<HomePageCaurosel />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video.muted).toBe(true);
    expect(video.getAttribute("src")).toBeTruthy();
  });
});
