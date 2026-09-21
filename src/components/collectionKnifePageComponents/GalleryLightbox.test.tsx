import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GalleryLightbox from "./GalleryLightbox";

const items = [{ fileId: "https://cdn/a.jpg" }, { fileId: "https://cdn/b.mp4" }, { fileId: "https://cdn/c.jpg" }];

afterEach(() => {
  document.body.style.overflow = "";
});

describe("GalleryLightbox", () => {
  it("renders the item at the current index and shows a 1-based counter", () => {
    render(<GalleryLightbox items={items} index={0} onClose={vi.fn()} onNavigate={vi.fn()} />);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByAltText("Gallery item 1")).toBeInTheDocument();
  });

  it("renders a <video> for a video URL instead of an <img>", () => {
    render(<GalleryLightbox items={items} index={1} onClose={vi.fn()} onNavigate={vi.fn()} />);
    expect(document.querySelector("video")).not.toBeNull();
    expect(document.querySelector("img")).toBeNull();
  });

  it("hides the prev arrow on the first item and the next arrow on the last item", () => {
    const { rerender } = render(<GalleryLightbox items={items} index={0} onClose={vi.fn()} onNavigate={vi.fn()} />);
    const buttonsAtStart = screen.getAllByRole("button");
    // close + next + 3 dots = 5 (no prev arrow)
    expect(buttonsAtStart.length).toBe(5);

    rerender(<GalleryLightbox items={items} index={2} onClose={vi.fn()} onNavigate={vi.fn()} />);
    const buttonsAtEnd = screen.getAllByRole("button");
    // close + prev + 3 dots = 5 (no next arrow)
    expect(buttonsAtEnd.length).toBe(5);
  });

  it("shows both arrows in the middle", () => {
    render(<GalleryLightbox items={items} index={1} onClose={vi.fn()} onNavigate={vi.fn()} />);
    // close + prev + next + 3 dots = 6
    expect(screen.getAllByRole("button").length).toBe(6);
  });

  it("hides the dot strip entirely for a single-item gallery", () => {
    render(<GalleryLightbox items={[items[0]]} index={0} onClose={vi.fn()} onNavigate={vi.fn()} />);
    // just the close button
    expect(screen.getAllByRole("button").length).toBe(1);
  });

  it("clicking the backdrop calls onClose", () => {
    const onClose = vi.fn();
    render(<GalleryLightbox items={items} index={0} onClose={onClose} onNavigate={vi.fn()} />);
    fireEvent.click(document.querySelector(".fixed")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking the media itself does not close the lightbox", () => {
    const onClose = vi.fn();
    render(<GalleryLightbox items={items} index={0} onClose={onClose} onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByAltText("Gallery item 1"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("clicking a dot navigates directly to that index", () => {
    const onNavigate = vi.fn();
    render(<GalleryLightbox items={items} index={0} onClose={vi.fn()} onNavigate={onNavigate} />);
    const dots = document.querySelectorAll(".absolute.bottom-5 button");
    fireEvent.click(dots[2]);
    expect(onNavigate).toHaveBeenCalledWith(2);
  });

  it("ArrowRight/ArrowLeft navigate, clamped at the bounds", () => {
    const onNavigate = vi.fn();
    render(<GalleryLightbox items={items} index={0} onClose={vi.fn()} onNavigate={onNavigate} />);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("Escape calls onClose", () => {
    const onClose = vi.fn();
    render(<GalleryLightbox items={items} index={0} onClose={onClose} onNavigate={vi.fn()} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("locks body scroll while open and restores it on unmount", () => {
    const { unmount } = render(<GalleryLightbox items={items} index={0} onClose={vi.fn()} onNavigate={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("removes its keydown listener on unmount (no further navigation calls)", () => {
    const onNavigate = vi.fn();
    const { unmount } = render(<GalleryLightbox items={items} index={0} onClose={vi.fn()} onNavigate={onNavigate} />);
    unmount();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
