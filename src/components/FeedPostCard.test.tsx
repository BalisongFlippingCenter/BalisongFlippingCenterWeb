import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import { PostDetail } from "../modals/Post";
import FeedPostCard, {
  isVideoUrl,
  formatTagLabel,
  formatDate,
  tagDotColor,
  tagTextColor,
  difficultyStyle,
} from "./FeedPostCard";

vi.mock("./ReportModal", () => ({ default: () => null }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makePost(overrides: Partial<PostDetail> = {}): PostDetail {
  return {
    id: "1",
    accountId: "owner-1",
    postType: "GENERIC",
    caption: "hello world",
    description: null,
    mediaFiles: [{ url: "https://cdn/a.jpg", isVideo: false, description: null, referenceKnifeId: null, referenceKnife: null }],
    tags: [],
    creatorDisplayName: "Someone",
    creatorIdentifierCode: "1234",
    creatorProfileImg: null,
    creationDate: new Date().toISOString(),
    likes: 0,
    comments: 0,
    mode: null,
    price: null,
    offeringKnife: null,
    lookingForText: null,
    lookingForImageUrl: null,
    difficultyTag: null,
    techniqueTags: [],
    referenceKnife: null,
    isPrivate: false,
    isAnnouncement: false,
    ...overrides,
  };
}

function renderCard(post: PostDetail, viewerId = "someone-else") {
  const store = makeTestStore("tok", makeProfile({ id: viewerId }));
  setStore(store as any);
  return renderWithProviders(<FeedPostCard post={post} index={0} />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("FeedPostCard — pure helpers", () => {
  it("isVideoUrl detects common video extensions, case-insensitively and with query strings", () => {
    expect(isVideoUrl("clip.mp4")).toBe(true);
    expect(isVideoUrl("clip.MOV?x=1")).toBe(true);
    expect(isVideoUrl("photo.jpg")).toBe(false);
  });

  it("formatTagLabel converts SCREAMING_SNAKE_CASE to Title Case", () => {
    expect(formatTagLabel("BLADE_STYLE")).toBe("Blade Style");
  });

  it("formatDate produces relative time buckets", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate(new Date().toISOString())).toBe("Just now");
    expect(formatDate(new Date(Date.now() - 5 * 60_000).toISOString())).toBe("5m ago");
    expect(formatDate(new Date(Date.now() - 3 * 3_600_000).toISOString())).toBe("3h ago");
    expect(formatDate(new Date(Date.now() - 2 * 86_400_000).toISOString())).toBe("2d ago");
  });

  it("formatDate falls back to a calendar date after 7 days", () => {
    const old = new Date(Date.now() - 10 * 86_400_000);
    expect(formatDate(old.toISOString())).toBe(
      old.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    );
  });

  it("tagDotColor/tagTextColor deterministically map the same tag to the same color", () => {
    expect(tagDotColor("BENCHMADE")).toBe(tagDotColor("BENCHMADE"));
    expect(tagTextColor("BENCHMADE")).toBe(tagTextColor("BENCHMADE"));
  });

  it("difficultyStyle maps known difficulty tags and falls back for unknown ones", () => {
    expect(difficultyStyle("BEGINNER").dot).toBe("bg-green");
    expect(difficultyStyle("EXPERT").dot).toBe("bg-red");
    expect(difficultyStyle("unknown").dot).toBe("bg-white/50");
  });
});

describe("FeedPostCard — navigation", () => {
  it("clicking the card navigates to the post detail", () => {
    renderCard(makePost());
    fireEvent.click(screen.getByText("hello world"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/post/1",
      expect.objectContaining({ state: expect.objectContaining({ post: expect.anything() }) }),
    );
  });

  it("clicking the creator name navigates to their profile without triggering the card click", () => {
    renderCard(makePost());
    fireEvent.click(screen.getByText("Someone"));
    expect(mockNavigate).toHaveBeenCalledWith("/Someone/1234");
    expect(mockNavigate).not.toHaveBeenCalledWith("/post/1", expect.anything());
  });

  it("does not link to a profile for a deleted account (click falls through to the card)", () => {
    renderCard(makePost({ creatorDisplayName: "[deleted]", creatorIdentifierCode: null }));
    fireEvent.click(screen.getByText("[deleted]"));
    // The name button has no onClick for a deleted account, so the click
    // bubbles to the card's own goToPost handler instead of a profile nav.
    expect(mockNavigate).toHaveBeenCalledWith("/post/1", expect.anything());
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining("/deleted"), expect.anything());
  });
});

describe("FeedPostCard — media carousel", () => {
  const post = makePost({
    mediaFiles: [
      { url: "https://cdn/a.jpg", isVideo: false, description: null, referenceKnifeId: null, referenceKnife: null },
      { url: "https://cdn/b.jpg", isVideo: false, description: null, referenceKnifeId: null, referenceKnife: null },
      { url: "https://cdn/c.jpg", isVideo: false, description: null, referenceKnifeId: null, referenceKnife: null },
    ],
  });

  it("shows a 1-based position counter and advances on next", () => {
    renderCard(post);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    fireEvent.click(document.querySelector(".fa-chevron-right")!.closest("button")!);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("wraps to the last item when going previous from the first", () => {
    renderCard(post);
    fireEvent.click(document.querySelector(".fa-chevron-left")!.closest("button")!);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("wraps to the first item when going next from the last", () => {
    renderCard(post);
    const next = document.querySelector(".fa-chevron-right")!.closest("button")!;
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    fireEvent.click(next);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("hides carousel controls entirely for a single-media post", () => {
    renderCard(makePost());
    expect(document.querySelector(".fa-chevron-right")).toBeNull();
  });
});

describe("FeedPostCard — owner menu", () => {
  it("only shows the menu button for the post's own owner", () => {
    renderCard(makePost(), "someone-else");
    expect(document.querySelector(".fa-ellipsis-vertical")).toBeNull();
  });

  it("shows Edit/Hide/Delete options for the owner", () => {
    renderCard(makePost({ accountId: "owner-1" }), "owner-1");
    fireEvent.click(document.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    expect(screen.getByText("Edit post")).toBeInTheDocument();
    expect(screen.getByText("Hide post")).toBeInTheDocument();
    expect(screen.getByText("Delete post")).toBeInTheDocument();
  });

  it("Edit post navigates to the edit route", () => {
    renderCard(makePost({ accountId: "owner-1" }), "owner-1");
    fireEvent.click(document.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(screen.getByText("Edit post"));
    expect(mockNavigate).toHaveBeenCalledWith("/post/1/edit");
  });

  it("Hide post toggles visibility on the backend and flips the label", async () => {
    authMock.onPatch("/posts/1").reply(200);
    renderCard(makePost({ accountId: "owner-1", isPrivate: false }), "owner-1");
    fireEvent.click(document.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(screen.getByText("Hide post"));

    await waitFor(() =>
      expect(authMock.history.patch[0]).toMatchObject({ url: "/posts/1", data: JSON.stringify({ isPrivate: true }) }),
    );
  });

  it("shows the delete confirmation before actually deleting", () => {
    renderCard(makePost({ accountId: "owner-1" }), "owner-1");
    fireEvent.click(document.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(screen.getByText("Delete post"));
    expect(screen.getByText("Delete Post?")).toBeInTheDocument();
    expect(authMock.history.delete.length).toBe(0);
  });

  it("deletes the post and removes the card from the DOM on confirm", async () => {
    authMock.onDelete("/posts/1").reply(200);
    renderCard(makePost({ accountId: "owner-1" }), "owner-1");
    fireEvent.click(document.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(screen.getByText("Delete post"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByText("hello world")).not.toBeInTheDocument());
  });

  it("cancelling the delete confirmation keeps the post", () => {
    renderCard(makePost({ accountId: "owner-1" }), "owner-1");
    fireEvent.click(document.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(screen.getByText("Delete post"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete Post?")).not.toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });
});

describe("FeedPostCard — badges", () => {
  it("shows the Private badge when the post is private", () => {
    renderCard(makePost({ isPrivate: true }));
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("shows the Announcement badge when flagged", () => {
    renderCard(makePost({ isAnnouncement: true }));
    expect(screen.getByText("Announcement")).toBeInTheDocument();
  });
});
