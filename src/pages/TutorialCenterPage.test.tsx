import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import TutorialCenterPage, { pushRecentlyViewed } from "./TutorialCenterPage";

vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div>feedcard:{post.id}</div>,
}));

// jsdom can't measure real layout, so a real virtualizer would report an
// empty viewport (nothing "in view"). Default to that; tests that need
// actual rendered rows opt in via virtualizerFull.value = true.
const virtualizerFull = vi.hoisted(() => ({ value: false }));

vi.mock("@tanstack/react-virtual", () => ({
  useWindowVirtualizer: (opts: any) => ({
    getVirtualItems: () =>
      virtualizerFull.value
        ? Array.from({ length: opts.count }, (_, index) => ({
            key: index,
            index,
            start: index * 550,
          }))
        : [],
    getTotalSize: () => opts.count * 550,
    measureElement: () => {},
    options: { scrollMargin: opts.scrollMargin ?? 0 },
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function makePost(overrides: Partial<any> = {}) {
  return {
    post: { id: "1", postType: "TRICK_TUTORIAL", caption: "A tutorial", ...overrides },
    author: { displayName: "Author", identifierCode: "1234" },
  };
}

function renderPage(loggedIn = false) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile({ identifierCode: "1234" }) : null);
  return renderWithProviders(<TutorialCenterPage />, store as any);
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  localStorage.clear();
  virtualizerFull.value = false;
});

describe("TutorialCenterPage — loading/error/empty", () => {
  it("shows a loading spinner, then renders posts", async () => {
    virtualizerFull.value = true;
    plainMock.onGet("/posts/any").reply(200, {
      content: [makePost({ id: "1" }), makePost({ id: "2" })],
      totalPages: 1,
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
    expect(screen.getByText("feedcard:2")).toBeInTheDocument();
  });

  it("shows an error state with a retry button when the fetch fails", async () => {
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("shows an empty state when there are no posts", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No posts yet.");
  });

  it("filters out posts that aren't COMBO or TRICK_TUTORIAL", async () => {
    virtualizerFull.value = true;
    plainMock.onGet("/posts/any").reply(200, {
      content: [
        makePost({ id: "1", postType: "GENERIC" }),
        makePost({ id: "2", postType: "COMBO" }),
        makePost({ id: "3", postType: "TRICK_TUTORIAL" }),
        makePost({ id: "4", postType: "BUY_SELL" }),
      ],
      totalPages: 1,
    });
    renderPage();
    await screen.findByText("feedcard:2");
    expect(screen.getByText("feedcard:3")).toBeInTheDocument();
    expect(screen.queryByText("feedcard:1")).not.toBeInTheDocument();
    expect(screen.queryByText("feedcard:4")).not.toBeInTheDocument();
  });

  // Unlike ProductWorldPage (which pads its virtualizer count with a
  // phantom "+1" loader row whenever hasMore is true, so the bottom-of-list
  // trigger fires even with zero posts), this page's virtualizer count is
  // just `posts.length` with no loader padding. A failed initial fetch
  // leaves posts empty, so virtualItems is always empty and the
  // infinite-scroll effect never fires — no retry-storm here.
  it("does not retry the failed fetch on its own when there are no posts to virtualize", async () => {
    virtualizerFull.value = true;
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");

    await new Promise((r) => setTimeout(r, 200));
    const postCalls = plainMock.history.get.filter((c) => c.url === "/posts/any");
    expect(postCalls.length).toBe(1);
  });
});

describe("TutorialCenterPage — filters", () => {
  it("switches the type filter, updates the URL, and refetches with postType", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No posts yet.");

    fireEvent.click(screen.getByRole("button", { name: "Combo" }));

    await waitFor(() => {
      const call = plainMock.history.get.find((c) => (c.params as any)?.postType === "COMBO");
      expect(call).toBeTruthy();
    });
  });

  it("switches the difficulty filter, updates the URL, and refetches with difficultyTag", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No posts yet.");

    fireEvent.click(screen.getByRole("button", { name: "Beginner" }));

    await waitFor(() => {
      const call = plainMock.history.get.find((c) => (c.params as any)?.difficultyTag === "BEGINNER");
      expect(call).toBeTruthy();
    });
  });
});

describe("TutorialCenterPage — skill level strip", () => {
  it("navigates to the level page when a skill level card is clicked", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No posts yet.");

    // "Intermediate" also appears as a difficulty-filter button in the right
    // sidebar, so target the skill-level card via its unique description text.
    fireEvent.click(screen.getByText("Step up your game.").closest("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/intermediate");
  });
});

describe("TutorialCenterPage — search", () => {
  it("shows matching tricks from tricks.json as suggestions while typing", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No posts yet.");

    const input = screen.getByPlaceholderText("Search tricks, tutorials, combos...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "rollout" } });

    await waitFor(() => expect(screen.getByText("Double Rollout")).toBeInTheDocument());

    fireEvent.mouseDown(screen.getByText("Double Rollout"));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/beginner/double-rollout");
  });

  it("submits a search on Enter, saves it to recent searches, and navigates to the search page", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage(true);
    await screen.findByText("No posts yet.");

    const input = screen.getByPlaceholderText("Search tricks, tutorials, combos...");
    fireEvent.change(input, { target: { value: "my search term" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/search?q=my%20search%20term");
    expect(JSON.parse(localStorage.getItem("tc_recent_searches_1234")!)).toEqual(["my search term"]);
  });

  it("caps the recent-search list at MAX_RECENT (8), keeping the newest first", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage(true);
    await screen.findByText("No posts yet.");

    const input = screen.getByPlaceholderText("Search tricks, tutorials, combos...");
    for (let i = 1; i <= 9; i++) {
      fireEvent.change(input, { target: { value: `term${i}` } });
      fireEvent.keyDown(input, { key: "Enter" });
    }

    const recent = JSON.parse(localStorage.getItem("tc_recent_searches_1234")!);
    expect(recent).toHaveLength(8);
    expect(recent[0]).toBe("term9");
    expect(recent).not.toContain("term1");
  });
});

describe("TutorialCenterPage — recently viewed tricks", () => {
  it("shows a placeholder when nothing has been viewed yet", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No posts yet.");
    // The sidebar is duplicated for different breakpoints (left aside at lg,
    // right aside below lg) — jsdom renders both regardless of CSS display.
    expect(screen.getAllByText("Tricks you visit will appear here for quick access.").length).toBeGreaterThan(0);
  });

  it("caps at MAX_RECENTLY_VIEWED (5), dedupes by slug+level, and orders most-recent-first", () => {
    const key = "tc_recently_viewed_tricks_guest";
    pushRecentlyViewed({ name: "Double Rollout", slug: "double-rollout", level: "beginner" }, key);
    pushRecentlyViewed({ name: "Fan", slug: "fan", level: "beginner" }, key);
    pushRecentlyViewed({ name: "Twirl", slug: "twirl", level: "beginner" }, key);
    pushRecentlyViewed({ name: "Aerial", slug: "aerial", level: "intermediate" }, key);
    pushRecentlyViewed({ name: "Ladder", slug: "ladder", level: "advanced" }, key);
    // Re-viewing the first trick (now at cap) should move it to the front, not duplicate it.
    pushRecentlyViewed({ name: "Double Rollout", slug: "double-rollout", level: "beginner" }, key);
    // A brand new trick pushes the list past the cap, evicting the oldest entry.
    pushRecentlyViewed({ name: "Chaplin", slug: "chaplin", level: "advanced" }, key);

    const stored = JSON.parse(localStorage.getItem(key)!);
    expect(stored).toHaveLength(5);
    expect(stored[0]).toEqual({ name: "Chaplin", slug: "chaplin", level: "advanced" });
    expect(stored.filter((t: any) => t.slug === "double-rollout")).toHaveLength(1);
    expect(stored.find((t: any) => t.slug === "fan")).toBeUndefined();
  });

  it("renders the most recently viewed trick and navigates to it on click", async () => {
    const key = "tc_recently_viewed_tricks_guest";
    pushRecentlyViewed({ name: "Double Rollout", slug: "double-rollout", level: "beginner" }, key);
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No posts yet.");

    fireEvent.click(screen.getAllByText("Double Rollout")[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/beginner/double-rollout");
  });
});
