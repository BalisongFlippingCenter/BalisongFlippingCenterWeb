import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import ProductWorldPage from "./ProductWorldPage";

vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div>feedcard:{post.id}</div>,
}));

// jsdom can't measure real layout, so a real virtualizer would report an
// empty viewport (nothing "in view"). Default to that — it also avoids
// tripping the infinite-scroll effect during unrelated tests. Tests that
// need actual rendered rows opt in via virtualizerFull.value = true.
const virtualizerFull = vi.hoisted(() => ({ value: false }));

vi.mock("@tanstack/react-virtual", () => ({
  useWindowVirtualizer: (opts: any) => ({
    getVirtualItems: () =>
      virtualizerFull.value
        ? Array.from({ length: opts.count }, (_, index) => ({
            key: index,
            index,
            start: index * 520,
          }))
        : [],
    getTotalSize: () => opts.count * 520,
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
    post: {
      id: "1",
      postType: "BUY_SELL",
      mode: "SELLING",
      caption: "For sale",
      offeringKnife: { id: "k1", displayName: "My Knife" },
      ...overrides,
    },
    author: { displayName: "Seller", identifierCode: "1234" },
  };
}

function mockEmptyCatalog() {
  plainMock.onGet("/catalog/any/knives").reply(200, []);
  plainMock.onGet("/catalog/any/makers").reply(200, []);
}

function renderPage(loggedIn = false) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile({ identifierCode: "1234" }) : null);
  return renderWithProviders(<ProductWorldPage />, store as any);
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  localStorage.clear();
  virtualizerFull.value = false;
});

describe("ProductWorldPage — loading/error/empty", () => {
  it("shows a loading spinner, then renders posts", async () => {
    virtualizerFull.value = true;
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [makePost({ id: "1" }), makePost({ id: "2" })], totalPages: 1 });
    renderPage();
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
    expect(screen.getByText("feedcard:2")).toBeInTheDocument();
  });

  it("shows an error state with a retry button when the fetch fails", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("shows an empty state when there are no marketplace posts", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No marketplace posts found.");
  });

  it("filters out posts that aren't BUY_SELL or TRADE, or that lack a required offeringKnife", async () => {
    virtualizerFull.value = true;
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, {
      content: [
        makePost({ id: "1", postType: "GENERIC", offeringKnife: null }),
        makePost({ id: "2", postType: "BUY_SELL", mode: "SELLING", offeringKnife: null }),
        makePost({ id: "3", postType: "BUY_SELL", mode: "BUYING", offeringKnife: null }),
        makePost({ id: "4", postType: "TRADE", offeringKnife: null }),
      ],
      totalPages: 1,
    });
    renderPage();
    await screen.findByText("feedcard:3");
    expect(screen.queryByText("feedcard:1")).not.toBeInTheDocument();
    expect(screen.queryByText("feedcard:2")).not.toBeInTheDocument();
    expect(screen.queryByText("feedcard:4")).not.toBeInTheDocument();
  });

  // Pins a real bug: on a failed fetch, `hasMore` is never reset (only the
  // success branch calls setHasMore), so the infinite-scroll effect keeps
  // seeing the loader row as "still pending more content" and retries
  // immediately, forever, with no backoff — hammering the API on any
  // transient failure whenever the loader row is within the viewport
  // (which it always is for an empty/failed initial load).
  it("retries the failed fetch repeatedly with no backoff because hasMore is never cleared on error", async () => {
    virtualizerFull.value = true;
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(500);
    renderPage();

    await waitFor(
      () => {
        const postCalls = plainMock.history.get.filter((c) => c.url === "/posts/any");
        expect(postCalls.length).toBeGreaterThan(2);
      },
      { timeout: 3000 },
    );
  });
});

describe("ProductWorldPage — type filter", () => {
  it("switches the listing type, updates the URL, and refetches with the new postType", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No marketplace posts found.");

    fireEvent.click(screen.getAllByText("Trade")[0]);

    await waitFor(() => {
      const tradeCall = plainMock.history.get.find((c) => (c.params as any)?.postType === "TRADE");
      expect(tradeCall).toBeTruthy();
    });
  });
});

describe("ProductWorldPage — knife spec filters", () => {
  it("toggling a spec filter shows an active-filter count and refetches with the spec param", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No marketplace posts found.");

    fireEvent.click(screen.getAllByText("Knife Type")[0]);
    const trainerButtons = screen.getAllByText("Trainer");
    fireEvent.click(trainerButtons[0]);

    await waitFor(() => {
      const call = plainMock.history.get.find((c) => (c.params as any)?.knifeType === "trainer");
      expect(call).toBeTruthy();
    });
    expect(screen.getAllByText("1 filter active").length).toBeGreaterThan(0);
  });
});

describe("ProductWorldPage — price filter", () => {
  it("applies a price range on blur and refetches with priceMin/priceMax", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No marketplace posts found.");

    const minInputs = screen.getAllByPlaceholderText("Min");
    fireEvent.change(minInputs[0], { target: { value: "50" } });
    fireEvent.blur(minInputs[0]);

    await waitFor(() => {
      const call = plainMock.history.get.find((c) => (c.params as any)?.priceMin === "50");
      expect(call).toBeTruthy();
    });
  });
});

describe("ProductWorldPage — clear all", () => {
  it("clears active filters and refetches without them", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No marketplace posts found.");

    fireEvent.click(screen.getAllByText("Knife Type")[0]);
    fireEvent.click(screen.getAllByText("Trainer")[0]);
    await waitFor(() => expect(screen.getAllByText("1 filter active").length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText("Clear all")[0]);

    await waitFor(() => expect(screen.queryByText("1 filter active")).not.toBeInTheDocument());
    const lastCall = plainMock.history.get[plainMock.history.get.length - 1];
    expect((lastCall.params as any)?.knifeType).toBeUndefined();
  });
});

describe("ProductWorldPage — search", () => {
  it("shows catalog knife/maker suggestions matching the typed query", async () => {
    plainMock.onGet("/catalog/any/knives").reply(200, [
      { slug: "k1", name: "Squid", makerName: "Squid Industries", makerSlug: "squid", bladeStyleSummary: "", handleMaterialSummary: "", priceRangeSummary: null, coverPhotoUrl: null, hasActiveVersion: true },
    ]);
    plainMock.onGet("/catalog/any/makers").reply(200, [
      { slug: "squid", name: "Squid Industries", country: "USA", logoUrl: null },
    ]);
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("No marketplace posts found.");

    const input = screen.getByPlaceholderText("Search knives, makers, models...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "squid" } });

    await waitFor(() => expect(screen.getByText("Knife Pages")).toBeInTheDocument());
    expect(screen.getAllByText("Squid").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Squid Industries").length).toBeGreaterThan(0);

    fireEvent.mouseDown(screen.getAllByText("Squid")[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/product-world/knife/k1");
  });

  it("submits a search on Enter, saves it to recent searches, and navigates to the search page", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage(true);
    await screen.findByText("No marketplace posts found.");

    const input = screen.getByPlaceholderText("Search knives, makers, models...");
    fireEvent.change(input, { target: { value: "my search term" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockNavigate).toHaveBeenCalledWith("/product-world/search?q=my%20search%20term");
    expect(JSON.parse(localStorage.getItem("pw_recent_searches_1234")!)).toEqual(["my search term"]);
  });

  it("caps the recent-search list at MAX_RECENT (8), keeping the newest first", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage(true);
    await screen.findByText("No marketplace posts found.");

    const input = screen.getByPlaceholderText("Search knives, makers, models...");
    for (let i = 1; i <= 9; i++) {
      fireEvent.change(input, { target: { value: `term${i}` } });
      fireEvent.keyDown(input, { key: "Enter" });
    }

    const recent = JSON.parse(localStorage.getItem("pw_recent_searches_1234")!);
    expect(recent).toHaveLength(8);
    expect(recent[0]).toBe("term9");
    expect(recent).not.toContain("term1");
  });
});

describe("ProductWorldPage — search history sidebar", () => {
  it("shows recent searches and removes one when its clear button is clicked", async () => {
    localStorage.setItem("pw_recent_searches_1234", JSON.stringify(["old search"]));
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage(true);
    await screen.findByText("No marketplace posts found.");

    const entries = screen.getAllByText("old search");
    expect(entries.length).toBeGreaterThan(0);

    const row = entries[0].closest(".group")!;
    fireEvent.click(row.querySelector(".fa-xmark")!.closest("button")!);

    await waitFor(() => {
      const remaining = JSON.parse(localStorage.getItem("pw_recent_searches_1234")!);
      expect(remaining).toEqual([]);
    });
  });
});
