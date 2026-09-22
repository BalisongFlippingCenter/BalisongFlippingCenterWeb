import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import GalleryInput from "./GalleryInput";

function makeFile(name: string, sizeMB: number, type = "image/jpeg"): File {
  const file = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(file, "size", { value: Math.round(sizeMB * 1024 * 1024) });
  return file;
}

function fileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

function selectFiles(files: File[]) {
  fireEvent.change(fileInput(), { target: { files } });
}

// The video-duration check creates a real <video> element and waits for
// onloadedmetadata/onerror. jsdom never fires either, so we intercept exactly
// `count` calls to document.createElement("video") (one per video file being
// checked) and fall back to the real implementation after that, so we don't
// also hijack React's own rendering of the <video> preview elements.
let pendingVideoEls: any[] = [];
const realCreateElement = document.createElement.bind(document);

function mockVideoElement(count = 1) {
  let remaining = count;
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag !== "video" || remaining <= 0) return realCreateElement(tag);
    remaining--;
    const el: any = { preload: "" };
    Object.defineProperty(el, "src", {
      set() {
        pendingVideoEls.push(el);
      },
    });
    return el;
  });
}

function resolveVideoDuration(duration: number) {
  const el = pendingVideoEls.shift();
  el.duration = duration;
  el.onloadedmetadata();
}

function rejectVideoLoad() {
  const el = pendingVideoEls.shift();
  el.onerror();
}

beforeEach(() => {
  pendingVideoEls = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GalleryInput — adding files", () => {
  it("adds valid image files and reports them to the parent", () => {
    const updateGalleryFiles = vi.fn();
    renderWithProviders(
      <GalleryInput updateGalleryFiles={updateGalleryFiles} setStepManually={vi.fn()} galleryFiles={null} />,
    );
    selectFiles([makeFile("a.jpg", 1), makeFile("b.jpg", 2)]);
    expect(screen.getByText("2/10")).toBeInTheDocument();
    expect(updateGalleryFiles).toHaveBeenLastCalledWith(expect.arrayContaining([expect.any(File)]));
  });

  it("rejects an image over the 15MB limit with a specific error, without adding it", () => {
    const updateGalleryFiles = vi.fn();
    renderWithProviders(
      <GalleryInput updateGalleryFiles={updateGalleryFiles} setStepManually={vi.fn()} galleryFiles={null} />,
    );
    selectFiles([makeFile("big.jpg", 20)]);
    expect(screen.getByText('"big.jpg" exceeds the 15 MB image limit.')).toBeInTheDocument();
    expect(screen.getByText("0/10")).toBeInTheDocument();
  });

  it("rejects a video over the 150MB limit with a specific error", () => {
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={null} />);
    selectFiles([makeFile("huge.mp4", 200, "video/mp4")]);
    expect(screen.getByText('"huge.mp4" exceeds the 150 MB video limit.')).toBeInTheDocument();
  });

  it("skips exact duplicate files (same name and size) silently", () => {
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={null} />);
    const file = makeFile("a.jpg", 1);
    selectFiles([file]);
    selectFiles([file]);
    expect(screen.getByText("1/10")).toBeInTheDocument();
  });

  it("stops adding once MAX_FILES (10) is reached", () => {
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={null} />);
    const files = Array.from({ length: 12 }, (_, i) => makeFile(`f${i}.jpg`, 1));
    selectFiles(files);
    expect(screen.getByText("10/10")).toBeInTheDocument();
  });

  it("rejects the whole incoming batch when the merged total exceeds 500MB", async () => {
    const files = Array.from({ length: 4 }, (_, i) => makeFile(`v${i}.mp4`, 130, "video/mp4"));
    mockVideoElement(files.length);
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={null} />);
    selectFiles(files);
    for (let i = 0; i < files.length; i++) {
      await waitFor(() => expect(pendingVideoEls.length).toBe(1));
      resolveVideoDuration(60);
    }

    await waitFor(() =>
      expect(screen.getByText("Total upload size cannot exceed 500 MB.")).toBeInTheDocument(),
    );
    expect(screen.getByText("0/10")).toBeInTheDocument();
  });

  it("accepts a video under the duration limit", async () => {
    mockVideoElement();
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={null} />);
    selectFiles([makeFile("clip.mp4", 5, "video/mp4")]);
    await waitFor(() => expect(pendingVideoEls.length).toBe(1));
    resolveVideoDuration(60);
    await waitFor(() => expect(screen.getByText("1/10")).toBeInTheDocument());
  });

  it("rejects a video over the duration limit", async () => {
    mockVideoElement();
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={null} />);
    selectFiles([makeFile("long.mp4", 5, "video/mp4")]);
    await waitFor(() => expect(pendingVideoEls.length).toBe(1));
    resolveVideoDuration(180);
    await waitFor(() => expect(screen.getByText('"long.mp4" is 180s — videos must be 120s or shorter.')).toBeInTheDocument());
  });

  it("rejects a video that fails to load metadata", async () => {
    mockVideoElement();
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={null} />);
    selectFiles([makeFile("broken.mp4", 5, "video/mp4")]);
    await waitFor(() => expect(pendingVideoEls.length).toBe(1));
    rejectVideoLoad();
    await waitFor(() => expect(screen.getByText('"broken.mp4" could not be read.')).toBeInTheDocument());
  });
});

describe("GalleryInput — removing files", () => {
  it("removing a file updates the count and notifies the parent", () => {
    const updateGalleryFiles = vi.fn();
    renderWithProviders(
      <GalleryInput updateGalleryFiles={updateGalleryFiles} setStepManually={vi.fn()} galleryFiles={null} />,
    );
    selectFiles([makeFile("a.jpg", 1)]);
    expect(screen.getByText("1/10")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(updateGalleryFiles).toHaveBeenLastCalledWith(null);
  });
});

describe("GalleryInput — step navigation", () => {
  it("shows Skip when no files are selected and Next Step once files are added", () => {
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={null} />);
    expect(screen.getByRole("button", { name: "Skip →" })).toBeInTheDocument();
    selectFiles([makeFile("a.jpg", 1)]);
    expect(screen.getByRole("button", { name: "Next Step →" })).toBeInTheDocument();
  });

  it("clicking the step button advances to step 3", () => {
    const setStepManually = vi.fn();
    renderWithProviders(<GalleryInput updateGalleryFiles={vi.fn()} setStepManually={setStepManually} galleryFiles={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip →" }));
    expect(setStepManually).toHaveBeenCalledWith("3");
  });
});

describe("GalleryInput — initial state", () => {
  it("initializes from a previously selected galleryFiles prop", () => {
    renderWithProviders(
      <GalleryInput updateGalleryFiles={vi.fn()} setStepManually={vi.fn()} galleryFiles={[makeFile("a.jpg", 1)]} />,
    );
    expect(screen.getByText("1/10")).toBeInTheDocument();
  });
});
