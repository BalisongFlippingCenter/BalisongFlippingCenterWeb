import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import GalleryInputSelectedFilesFileCoverDisplay from "./GalleryInputSelectedFilesFileCoverDisplay";

describe("GalleryInputSelectedFilesFileCoverDisplay", () => {
  it("renders an image for a non-video file", async () => {
    const file = new File(["img"], "photo.png", { type: "image/png" });
    const { container } = render(<GalleryInputSelectedFilesFileCoverDisplay file={file} />);
    expect(await screen.findByRole("img")).toBeInTheDocument();
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("renders a video element for an mp4 file", async () => {
    const file = new File(["vid"], "clip.mp4", { type: "video/mp4" });
    const { container } = render(<GalleryInputSelectedFilesFileCoverDisplay file={file} />);
    expect(await screen.findByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("calls removeFile with the file's index when Remove is clicked", async () => {
    const removeFile = vi.fn();
    const file = new File(["img"], "photo.png", { type: "image/png" });
    render(<GalleryInputSelectedFilesFileCoverDisplay file={file} index={2} removeFile={removeFile} />);
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
    expect(removeFile).toHaveBeenCalledWith(2);
  });

  it("calls changeCurrentIndex with the file's index on mouseover", async () => {
    const changeCurrentIndex = vi.fn();
    const file = new File(["img"], "photo.png", { type: "image/png" });
    const { container } = render(
      <GalleryInputSelectedFilesFileCoverDisplay file={file} index={3} changeCurrentIndex={changeCurrentIndex} />,
    );
    await screen.findByRole("img");
    fireEvent.mouseOver(container.firstChild as HTMLElement);
    expect(changeCurrentIndex).toHaveBeenCalledWith(3);
  });
});
