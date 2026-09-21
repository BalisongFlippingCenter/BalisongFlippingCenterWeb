import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import ProductWorldSearchPage from "./ProductWorldSearchPage";

vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div>feedcard:{post.id}</div>,
}));

const mockNavigate = vi.fn();
let initialEntry = "/product-world/search";
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function makePost(overrides: Partial<any> = {}) {
  return {
    post: { id: "1", postType: "BUY_SELL", caption: "For sale", ...overrides },
    author: { displayName: "Seller", identifierCode: "1234" },
  };
}

function mockEmptyCatalog() {
  plainMock.onGet("/catalog/any/knives").reply(200, []);
  plainMock.onGet("/catalog/any/makers").reply(200, []);
}

function renderPage() {
  const store = makeTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProductWorldSearchPage />
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  initialEntry = "/product-world/search";
});

describe("ProductWorldSearchPage — no query", () => {
  it("prompts for a search term and doesn't fetch posts", async () => {
    mockEmptyCatalog();
    renderPage();
    await screen.findByText("Enter a search term to find listings.");
    expect(plainMock.history.get.find((c) => c.url === "/posts/any")).toBeUndefined();
  });

  it("navigates back to Product World", async () => {
    mockEmptyCatalog();
    renderPage();
    await screen.findByText("Enter a search term to find listings.");
    fireEvent.click(screen.getByText("Product World"));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world");
  });
});

describe("ProductWorldSearchPage — post feed", () => {
  it("shows a loading state then renders matching posts", async () => {
    initialEntry = "/product-world/search?q=knife";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [makePost({ id: "1" }), makePost({ id: "2" })], totalPages: 1 });
    renderPage();
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
    expect(screen.getByText("feedcard:2")).toBeInTheDocument();
  });

  it("filters out posts that aren't BUY_SELL or TRADE", async () => {
    initialEntry = "/product-world/search?q=knife";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, {
      content: [
        makePost({ id: "1", postType: "GENERIC" }),
        makePost({ id: "2", postType: "BUY_SELL" }),
        makePost({ id: "3", postType: "TRADE" }),
      ],
      totalPages: 1,
    });
    renderPage();
    await screen.findByText("feedcard:2");
    expect(screen.getByText("feedcard:3")).toBeInTheDocument();
    expect(screen.queryByText("feedcard:1")).not.toBeInTheDocument();
  });

  it("shows an error state with a retry button when the fetch fails", async () => {
    initialEntry = "/product-world/search?q=knife";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    initialEntry = "/product-world/search?q=knife";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText('No listings found for "knife".');
  });

  it("loads the next page and appends results", async () => {
    initialEntry = "/product-world/search?q=knife";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply((config) => {
      const page = (config.params as any)?.page ?? 0;
      return page === 0
        ? [200, { content: [makePost({ id: "1" })], totalPages: 2 }]
        : [200, { content: [makePost({ id: "2" })], totalPages: 2 }];
    });
    renderPage();
    await screen.findByText("feedcard:1");

    fireEvent.click(screen.getByText("Load more"));

    await waitFor(() => expect(screen.getByText("feedcard:2")).toBeInTheDocument());
    expect(screen.getByText("feedcard:1")).toBeInTheDocument();
  });

  it("passes the listing type filter as postType", async () => {
    initialEntry = "/product-world/search?q=knife&type=TRADE";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await waitFor(() => {
      const call = plainMock.history.get.find((c) => c.url === "/posts/any");
      expect((call?.params as any)?.postType).toBe("TRADE");
    });
  });
});

describe("ProductWorldSearchPage — filter chips", () => {
  it("switching the listing filter updates the active chip and the results header stays scoped to the query", async () => {
    initialEntry = "/product-world/search?q=knife";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText('No listings found for "knife".');

    fireEvent.click(screen.getByText("Trade"));

    await waitFor(() => {
      const call = plainMock.history.get.filter((c) => c.url === "/posts/any").at(-1);
      expect((call?.params as any)?.postType).toBe("TRADE");
    });
  });
});

describe("ProductWorldSearchPage — catalog matches", () => {
  it("shows matching knife and maker pages, and navigates on click", async () => {
    initialEntry = "/product-world/search?q=squid";
    plainMock.onGet("/catalog/any/knives").reply(200, [
      { slug: "k1", name: "Squid", makerName: "Squid Industries", makerSlug: "squid", bladeStyleSummary: "", handleMaterialSummary: "", priceRangeSummary: null, coverPhotoUrl: null, hasActiveVersion: true },
    ]);
    plainMock.onGet("/catalog/any/makers").reply(200, [
      { slug: "squid", name: "Squid Industries", country: "USA", logoUrl: null },
    ]);
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();

    await waitFor(() => expect(screen.getByText("Knife Pages")).toBeInTheDocument());
    expect(screen.getByText("Maker Pages")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Squid"));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world/knife/k1");
  });

  it("hides the sections when nothing in the catalog matches", async () => {
    initialEntry = "/product-world/search?q=zzz-nomatch";
    plainMock.onGet("/catalog/any/knives").reply(200, [
      { slug: "k1", name: "Squid", makerName: "Squid Industries", makerSlug: "squid", bladeStyleSummary: "", handleMaterialSummary: "", priceRangeSummary: null, coverPhotoUrl: null, hasActiveVersion: true },
    ]);
    plainMock.onGet("/catalog/any/makers").reply(200, []);
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();

    await screen.findByText('No listings found for "zzz-nomatch".');
    expect(screen.queryByText("Knife Pages")).not.toBeInTheDocument();
  });
});

describe("ProductWorldSearchPage — search input", () => {
  it("shows the current query in the results header", async () => {
    initialEntry = "/product-world/search?q=balisong";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText('"balisong"');
  });

  it("submits a trimmed query on Enter, updating the URL", async () => {
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText("Enter a search term to find listings.");

    const input = screen.getByPlaceholderText("Search knives, makers, models...");
    fireEvent.change(input, { target: { value: "  butterfly  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    await screen.findByText('"butterfly"');
  });

  it("does not submit a blank/whitespace-only query", async () => {
    mockEmptyCatalog();
    renderPage();
    await screen.findByText("Enter a search term to find listings.");

    const input = screen.getByPlaceholderText("Search knives, makers, models...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Enter a search term to find listings.")).toBeInTheDocument();
  });

  it("clears the input via the X button", async () => {
    initialEntry = "/product-world/search?q=balisong";
    mockEmptyCatalog();
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    const input = await screen.findByPlaceholderText("Search knives, makers, models...");
    expect(input).toHaveValue("balisong");

    fireEvent.click(document.querySelector(".fa-xmark")!.closest("button")!);
    expect(input).toHaveValue("");
  });
});
