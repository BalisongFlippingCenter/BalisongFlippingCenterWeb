import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import NewPostImageDisplay from "./NewPostImageDisplay";

function makeFiles(names: string[]) {
  return names.map((n) => new File(["x"], n, { type: "image/png" }));
}

describe("NewPostImageDisplay", () => {
  it("renders nothing when there are no files", () => {
    const { container } = render(
      <NewPostImageDisplay files={[]} filesAutoFocus={false} deleteSelectedFile={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a single image with no thumbnail strip for one file", () => {
    const { container } = render(
      <NewPostImageDisplay files={makeFiles(["a.png"])} filesAutoFocus={false} deleteSelectedFile={vi.fn()} />,
    );
    expect(container.querySelectorAll("img").length).toBe(1);
  });

  it("renders a thumbnail per file for multiple files", () => {
    const { container } = render(
      <NewPostImageDisplay files={makeFiles(["a.png", "b.png", "c.png"])} filesAutoFocus={false} deleteSelectedFile={vi.fn()} />,
    );
    // main image + 3 thumbnails
    expect(container.querySelectorAll("img").length).toBe(4);
  });

  it("calls deleteSelectedFile with the current index when X is clicked", () => {
    const deleteSelectedFile = vi.fn();
    render(
      <NewPostImageDisplay files={makeFiles(["a.png", "b.png"])} filesAutoFocus={false} deleteSelectedFile={deleteSelectedFile} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "X" }));
    expect(deleteSelectedFile).toHaveBeenCalledWith(0);
  });

  it("switches the main image when a thumbnail is clicked", () => {
    const { container } = render(
      <NewPostImageDisplay files={makeFiles(["a.png", "b.png"])} filesAutoFocus={false} deleteSelectedFile={vi.fn()} />,
    );
    const thumbnails = container.querySelectorAll(".w-40.h-40 img");
    fireEvent.click(thumbnails[1]);
    const mainImg = container.querySelector(".h-96 img") as HTMLImageElement;
    expect(mainImg.src).toContain("blob:");
  });

  it("navigates with arrow keys when filesAutoFocus is true", () => {
    const { container } = render(
      <NewPostImageDisplay files={makeFiles(["a.png", "b.png", "c.png"])} filesAutoFocus={true} deleteSelectedFile={vi.fn()} />,
    );
    const focusInput = container.querySelector("input") as HTMLInputElement;
    fireEvent.keyDown(focusInput, { code: "ArrowRight" });
    // After moving right from index 0, index 1's thumbnail should now be the "current" (bordered) one
    expect(container.querySelectorAll(".w-40.h-40")[1].querySelector("img")).toHaveClass("border-4");
  });
});
