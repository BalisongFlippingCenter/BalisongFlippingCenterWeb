import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PostFilesDisplay from "./PostFilesDisplay";

function makeFiles(n: number): File[] {
  return Array.from({ length: n }, (_, i) => new File(["x"], `f${i}.jpg`, { type: "image/jpeg" }));
}

// The global test-setup stub for URL.createObjectURL returns a constant
// string for every file, which makes carousel-navigation assertions
// (comparing <img src>) meaningless. Give each File a distinct URL here.
const realCreateObjectURL = URL.createObjectURL;
beforeAll(() => {
  URL.createObjectURL = (obj: Blob) => `blob:mock-url/${(obj as File).name ?? "x"}`;
});
afterAll(() => {
  URL.createObjectURL = realCreateObjectURL;
});

describe("PostFilesDisplay — carousel navigation (File[] mode)", () => {
  it("hides prev/next controls for a single file", () => {
    render(<PostFilesDisplay files={makeFiles(1)} />);
    expect(screen.queryByText(">")).not.toBeInTheDocument();
    expect(screen.queryByText("<")).not.toBeInTheDocument();
  });

  it("advances forward and wraps from the last back to the first", () => {
    render(<PostFilesDisplay files={makeFiles(3)} />);
    const img = () => screen.getByRole("img") as HTMLImageElement;
    const start = img().src;

    fireEvent.click(screen.getByText(">"));
    const second = img().src;
    expect(second).not.toBe(start);

    fireEvent.click(screen.getByText(">"));
    fireEvent.click(screen.getByText(">"));
    expect(img().src).toBe(start);
  });

  it("goes backward and wraps from the first to the last", () => {
    render(<PostFilesDisplay files={makeFiles(3)} />);
    const img = () => screen.getByRole("img") as HTMLImageElement;
    const start = img().src;

    fireEvent.click(screen.getByText("<"));
    expect(img().src).not.toBe(start);

    fireEvent.click(screen.getByText(">"));
    expect(img().src).toBe(start);
  });

  it("toggles fullscreen layout", () => {
    const { container } = render(<PostFilesDisplay files={makeFiles(1)} />);
    expect(container.querySelector(".h-96")).not.toBeNull();
    fireEvent.click(screen.getByText("[]"));
    expect(container.querySelector(".h-96")).toBeNull();
    expect(container.querySelector(".absolute.right-0.top-0.left-0.bottom-0")).not.toBeNull();
  });
});
