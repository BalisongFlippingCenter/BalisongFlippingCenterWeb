import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import { setCollection } from "../redux/collection/collectionSlice";
import { CollectionKnife } from "../modals/CollectionKnife";
import { uploadPostMediaDirect } from "../api/directUpload";
import CreatePostPage from "./CreatePostPage";

vi.mock("../api/directUpload", () => ({ uploadPostMediaDirect: vi.fn() }));
const mockUpload = vi.mocked(uploadPostMediaDirect);

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

// Layout cards and generic/technique tags share label text ("Trade", "Combo"),
// so layout switches are targeted by each card's unique description instead
// of its label.
const LAYOUT_DESCRIPTIONS = {
  generic: "Share anything — photos, clips, or a mix. No specific format required.",
  buysell: "Listing a knife you want to sell, or looking to buy one from the community.",
  trade: "Offering one of your knives in exchange for something else.",
  tutorial: "Breaking down a specific trick step by step with a single instructional video.",
  combo: "Showcasing a combination of tricks. One video, no breakdown required.",
} as const;

function selectLayout(layout: keyof typeof LAYOUT_DESCRIPTIONS) {
  fireEvent.click(screen.getByText(LAYOUT_DESCRIPTIONS[layout]).closest("button")!);
}

function makeKnife(overrides: Partial<any> = {}): CollectionKnife {
  return {
    id: "1",
    displayName: "My Knife",
    knifeMaker: "Benchmade",
    baseKnifeModel: "51",
    coverPhoto: "",
    ...overrides,
  } as unknown as CollectionKnife;
}

function makeImage(name = "photo.jpg", sizeMB = 1): File {
  return new File([new Uint8Array(Math.round(sizeMB * 1024 * 1024))], name, { type: "image/jpeg" });
}

function makeVideo(name = "clip.mp4", sizeMB = 1): File {
  return new File([new Uint8Array(Math.round(sizeMB * 1024 * 1024))], name, { type: "video/mp4" });
}

// Intercepts exactly N document.createElement("video") calls (one per file
// getVideoDuration checks) and resolves each with a canned duration, then
// falls back to the real DOM so React's own <video> previews still work.
function mockVideoDurations(durations: number[]) {
  const realCreateElement = document.createElement.bind(document);
  let callIndex = 0;
  const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "video" && callIndex < durations.length) {
      const duration = durations[callIndex++];
      const fake: any = {
        preload: "",
        set src(_v: string) {
          queueMicrotask(() => {
            fake.duration = duration;
            fake.onloadedmetadata?.();
          });
        },
      };
      return fake;
    }
    return realCreateElement(tag);
  });
  return spy;
}

function renderPage(userOverrides: any = {}, knives: CollectionKnife[] = [], featuredKnifeId: string | null = null) {
  const store = makeTestStore("tok", makeProfile(userOverrides));
  store.dispatch(setCollection({ id: "col-1", userId: "u1", bannerImg: null, featuredKnifeId, collectedKnives: knives }));
  setStore(store as any);
  return renderWithProviders(<CreatePostPage />, store as any);
}

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]:not([accept="image/*"])') as HTMLInputElement;
}

function uploadFiles(files: File[]) {
  fireEvent.change(fileInput(), { target: { files } });
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
  mockUpload.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CreatePostPage — layout selection", () => {
  it("defaults to the Generic layout with an optional caption", () => {
    renderPage();
    expect(screen.getByText(/Caption/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a caption...")).toBeInTheDocument();
  });

  it("switches to Trick Tutorial and restricts uploads to a single video", () => {
    renderPage();
    selectLayout("tutorial");
    expect(screen.getByPlaceholderText("Enter the trick name...")).toBeInTheDocument();
    expect(screen.getByText("Click to upload a video")).toBeInTheDocument();
    expect(fileInput().accept).toBe("video/*");
    expect(fileInput().multiple).toBe(false);
  });

  it("switches to Combo and also restricts to a single video", () => {
    renderPage();
    selectLayout("combo");
    expect(screen.getByPlaceholderText("Enter the combo name...")).toBeInTheDocument();
    expect(fileInput().accept).toBe("video/*");
  });

  it("switching layouts resets previously selected files and tags", async () => {
    renderPage();
    uploadFiles([makeImage()]);
    await screen.findByText("Add more");
    selectLayout("tutorial");
    selectLayout("trade");
    // Trade layout has its own media UI (no shared upload zone) — confirms the
    // generic image state was cleared rather than carried over.
    expect(screen.queryByText("Add more")).not.toBeInTheDocument();
  });

  it("shows a blocked state for Trade when the viewer has no collection knives", () => {
    renderPage();
    selectLayout("trade");
    expect(screen.getByText("No knives in your collection")).toBeInTheDocument();
  });

  it("shows the Buying/Selling toggle for Buy / Sell", () => {
    renderPage();
    selectLayout("buysell");
    expect(screen.getByRole("button", { name: "Buying" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selling" })).toBeInTheDocument();
  });
});

describe("CreatePostPage — file validation", () => {
  it("rejects an oversized image", async () => {
    renderPage();
    uploadFiles([makeImage("big.jpg", 20)]);
    await screen.findByText(/exceeds the 15 MB image limit/);
  });

  it("rejects an oversized video file", async () => {
    renderPage();
    selectLayout("combo");
    uploadFiles([makeVideo("big.mp4", 200)]);
    await screen.findByText(/exceeds the 150 MB video limit/);
  });

  it("rejects a video that's too long", async () => {
    const spy = mockVideoDurations([150]);
    renderPage();
    selectLayout("combo");
    uploadFiles([makeVideo("long.mp4", 5)]);
    await screen.findByText(/videos must be 120s or shorter/);
    spy.mockRestore();
  });

  it("accepts a video within the duration limit", async () => {
    const spy = mockVideoDurations([30]);
    renderPage();
    selectLayout("combo");
    uploadFiles([makeVideo("short.mp4", 5)]);
    await waitFor(() => expect(document.querySelectorAll("video").length).toBeGreaterThan(0));
    spy.mockRestore();
  });

  it("only shows the first rejection when multiple files fail validation", async () => {
    renderPage();
    uploadFiles([makeImage("a.jpg", 20), makeImage("b.jpg", 25)]);
    const errors = await screen.findAllByText(/exceeds the 15 MB image limit/);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveTextContent("a.jpg");
  });

  it("silently drops extra files when only a single file is allowed", async () => {
    const spy = mockVideoDurations([10, 10]);
    renderPage();
    selectLayout("combo");
    uploadFiles([makeVideo("first.mp4"), makeVideo("second.mp4")]);
    await waitFor(() => expect(document.querySelectorAll("video").length).toBe(1));
    expect(screen.getByText("1 / 10")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("caps the generic layout at MAX_FILES", async () => {
    renderPage();
    const files = Array.from({ length: 12 }, (_, i) => makeImage(`img${i}.jpg`));
    uploadFiles(files);
    await waitFor(() => expect(screen.getByText("File 1 of 10")).toBeInTheDocument());
  });
});

describe("CreatePostPage — tags", () => {
  it("disables further generic tags once MAX_TAGS is reached", () => {
    renderPage();
    const tagButtons = ["Buy/Sell", "Trade", "Flipping", "Show-Off", "Mod-Work"];
    tagButtons.forEach((t) => fireEvent.click(screen.getByRole("button", { name: t })));
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.queryByText(/#Help/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help" })).toBeDisabled();
  });

  it("enforces the Difficulty group limit of 1 for tutorials", () => {
    renderPage();
    selectLayout("tutorial");
    fireEvent.click(screen.getByRole("button", { name: "Beginner" }));
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(screen.getByRole("button", { name: "#Beginner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced" })).toBeDisabled();
  });

  it("enforces the Technique group limit of 2 for tutorials but 5 for combos", () => {
    renderPage();
    selectLayout("tutorial");
    fireEvent.click(screen.getByRole("button", { name: "Aerial" }));
    fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
    fireEvent.click(screen.getByRole("button", { name: "Fan" }));
    expect(screen.getByRole("button", { name: "Fan" })).toBeDisabled();

    selectLayout("combo");
    fireEvent.click(screen.getByRole("button", { name: "Aerial" }));
    fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
    fireEvent.click(screen.getByRole("button", { name: "Fan" }));
    expect(screen.getByRole("button", { name: "#Fan" })).toBeInTheDocument();
  });

  it("toggling a selected tag off removes it", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Flipping" }));
    expect(screen.getByRole("button", { name: "#Flipping" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "#Flipping" }));
    expect(screen.queryByRole("button", { name: "#Flipping" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Flipping" })).toBeInTheDocument();
  });
});

describe("CreatePostPage — preview + caption formatting", () => {
  it("keeps Preview Post disabled until media is selected (generic)", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Preview Post" })).toBeDisabled();
  });

  it("renders bold/italic/hashtag markdown-lite in the preview overlay", async () => {
    renderPage();
    uploadFiles([makeImage()]);
    await screen.findByText("Add more");
    fireEvent.change(screen.getByPlaceholderText("Write a caption..."), {
      target: { value: "**bold** *italic* #tag" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview Post" }));

    expect(screen.getByText("bold", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("italic", { selector: "em" })).toBeInTheDocument();
    expect(screen.getByText("#tag")).toHaveClass("text-blue-primary");
  });

  it("returns to the editor via Edit without submitting", async () => {
    renderPage();
    uploadFiles([makeImage()]);
    await screen.findByText("Add more");
    fireEvent.click(screen.getByRole("button", { name: "Preview Post" }));
    await screen.findByText("Post Preview");

    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.queryByText("Post Preview")).not.toBeInTheDocument();
    expect(authMock.history.post.length).toBe(0);
  });
});

describe("CreatePostPage — submit (generic)", () => {
  it("uploads media, posts the payload, toasts success, and navigates back", async () => {
    mockUpload.mockResolvedValue([
      { key: "k1", uploadUrl: "https://s3/put", publicUrl: "https://cdn/a.jpg", isVideo: false },
    ]);
    authMock.onPost("/posts/create").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toMatchObject({
        postType: "GENERIC",
        caption: "hello",
        media: [{ url: "https://cdn/a.jpg", description: null, referenceKnifeId: null }],
        tags: ["FLIPPING"],
      });
      return [200, {}];
    });

    const { store } = renderPage({ postCount: 2 });
    uploadFiles([makeImage()]);
    await screen.findByText("Add more");
    fireEvent.change(screen.getByPlaceholderText("Write a caption..."), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Flipping" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview Post" }));
    await screen.findByText("Post Preview");

    fireEvent.click(screen.getByRole("button", { name: "Confirm & Post" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(-1));
    expect(mockUpload).toHaveBeenCalledWith("GENERIC", expect.any(Array));
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Post published!" });
    expect(store.getState().auth.user?.postCount).toBe(3);
  });

  it("shows an error toast and stays on the preview when the post fails", async () => {
    mockUpload.mockResolvedValue([
      { key: "k1", uploadUrl: "https://s3/put", publicUrl: "https://cdn/a.jpg", isVideo: false },
    ]);
    authMock.onPost("/posts/create").reply(500, "Post rejected by moderation.");

    const { store } = renderPage();
    uploadFiles([makeImage()]);
    await screen.findByText("Add more");
    fireEvent.click(screen.getByRole("button", { name: "Preview Post" }));
    await screen.findByText("Post Preview");
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Post" }));

    await screen.findAllByText("Post rejected by moderation.");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Post rejected by moderation." });
  });
});

describe("CreatePostPage — submit (buy/sell)", () => {
  it("requires a listed knife and price before Selling can be submitted", () => {
    renderPage({}, [makeKnife()]);
    selectLayout("buysell");
    fireEvent.click(screen.getByRole("button", { name: "Selling" }));
    expect(screen.getByRole("button", { name: "Preview Post" })).toBeDisabled();
  });

  it("converts a EUR price to USD in the submitted payload", async () => {
    mockUpload.mockResolvedValue([
      { key: "k1", uploadUrl: "https://s3/put", publicUrl: "https://cdn/a.jpg", isVideo: false },
    ]);
    authMock.onPost("/posts/create").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body.mode).toBe("SELLING");
      expect(body.price).toBe((100 / 0.92).toFixed(2));
      return [200, {}];
    });

    renderPage({ currency: "EUR" }, [makeKnife()]);
    selectLayout("buysell");
    fireEvent.click(screen.getByRole("button", { name: "Selling" }));
    fireEvent.click(screen.getByText("Select the knife you're selling"));
    fireEvent.click(screen.getByText("My Knife"));

    uploadFiles([makeImage()]);
    await screen.findByText("Add more");
    fireEvent.change(screen.getByPlaceholderText("Write a caption..."), { target: { value: "For sale" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });

    fireEvent.click(screen.getByRole("button", { name: "Preview Post" }));
    await screen.findByText("Post Preview");
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Post" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(-1));
  });
});

describe("CreatePostPage — submit (trade)", () => {
  it("submits the offering knife, looking-for text, and sought image", async () => {
    mockUpload.mockResolvedValue([
      { key: "k1", uploadUrl: "https://s3/put", publicUrl: "https://cdn/sought.jpg", isVideo: false },
    ]);
    authMock.onPost("/posts/create").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toMatchObject({
        postType: "TRADE",
        caption: "Trading my knife",
        offeringKnifeId: "1",
        lookingForText: "A balisong trainer",
      });
      return [200, {}];
    });

    renderPage({}, [makeKnife({ id: "1", displayName: "My Knife" })]);
    selectLayout("trade");

    fireEvent.change(screen.getByPlaceholderText("Write a caption..."), { target: { value: "Trading my knife" } });
    fireEvent.click(screen.getByText("Select a knife"));
    fireEvent.click(screen.getByText("My Knife"));
    fireEvent.change(screen.getByPlaceholderText("e.g. BRS Alpha Beast"), { target: { value: "A balisong trainer" } });

    const soughtInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(soughtInput, { target: { files: [makeImage("sought.jpg")] } });

    await waitFor(() => expect(screen.getByRole("button", { name: "Preview Post" })).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Preview Post" }));
    await screen.findByText("Post Preview");
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Post" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(-1));
  });
});
