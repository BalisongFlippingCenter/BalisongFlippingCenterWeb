import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders";
import CollectionTimelineFilesDisplay from "./CollectionTimelineFilesDisplay";

const urls = [
  "https://bucket.s3.amazonaws.com/one.jpg",
  "https://bucket.s3.amazonaws.com/two.jpg",
  "https://bucket.s3.amazonaws.com/three.jpg",
];

describe("CollectionTimelineFilesDisplay", () => {
  it("shows no arrows for a single file", () => {
    renderWithProviders(<CollectionTimelineFilesDisplay files={[urls[0]]} />);
    expect(screen.queryByRole("img")).toBeInTheDocument();
    expect(document.querySelector('[data-icon="chevron-left"]')).not.toBeInTheDocument();
  });

  it("shows the first file initially and navigation arrows for multiple files", () => {
    const { container } = renderWithProviders(<CollectionTimelineFilesDisplay files={urls} />);
    const visible = container.querySelectorAll(".w-full.h-full.overflow-hidden");
    expect(visible.length).toBe(1);
    expect(visible[0].querySelector("img")).toHaveAttribute("src", urls[0]);
  });

  it("advances to the next file when the right arrow is clicked, wrapping at the end", () => {
    const { container } = renderWithProviders(<CollectionTimelineFilesDisplay files={urls} />);
    const rightArrow = document.querySelector('[data-icon="chevron-right"]') as HTMLElement;

    fireEvent.click(rightArrow);
    expect(container.querySelector(".w-full.h-full.overflow-hidden img")).toHaveAttribute("src", urls[1]);

    fireEvent.click(rightArrow);
    expect(container.querySelector(".w-full.h-full.overflow-hidden img")).toHaveAttribute("src", urls[2]);

    fireEvent.click(rightArrow);
    expect(container.querySelector(".w-full.h-full.overflow-hidden img")).toHaveAttribute("src", urls[0]);
  });

  it("goes to the previous file when the left arrow is clicked, wrapping at the start", () => {
    const { container } = renderWithProviders(<CollectionTimelineFilesDisplay files={urls} />);
    const leftArrow = document.querySelector('[data-icon="chevron-left"]') as HTMLElement;

    fireEvent.click(leftArrow);
    expect(container.querySelector(".w-full.h-full.overflow-hidden img")).toHaveAttribute("src", urls[2]);
  });
});
