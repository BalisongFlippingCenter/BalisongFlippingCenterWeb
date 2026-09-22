import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import GlobalSearchPage from "./GlobalSearchPage";

vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div>feedcard:{post.id}</div>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

let initialEntry = "/search";

function makePost(overrides: Partial<any> = {}) {
  return {
    post: { id: "1", postType: "GENERIC", caption: "A post", ...overrides },
    author: { displayName: "Author", identifierCode: "1234" },
  };
}

function makeUser(overrides: Partial<any> = {}) {
  return {
    accountId: "u1",
    displayName: "someuser",
    identifierCode: "1234",
    profileImg: null,
    profileCaption: null,
    ...overrides,
  };
}

function makeKnife(overrides: Partial<any> = {}) {
  return {
    slug: "knife-1",
    name: "Knife One",
    makerName: "Maker",
    makerSlug: "maker-1",
    bladeStyleSummary: "Bowie",
    handleMaterialSummary: "G10",
    priceRangeSummary: "$100-150",
    coverPhotoUrl: null,
    hasActiveVersion: true,
    ...overrides,
  };
}

function makeMaker(overrides: Partial<any> = {}) {
  return {
    slug: "maker-1",
    name: "Acme Knives",
    country: "USA",
    logoUrl: null,
    ...overrides,
  };
}

// Defaults so components that fetch on every query (Users, Knives) don't hang
// pending in tests that don't care about them.
function mockDefaults() {
  plainMock.onGet("/accounts/any/search").reply(200, []);
  plainMock.onGet("/catalog/any/knives").reply(200, []);
  plainMock.onGet("/catalog/any/makers").reply(200, []);
  plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
}

function renderPage() {
  const store = makeTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GlobalSearchPage />
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  initialEntry = "/search";
});

describe("GlobalSearchPage — no query", () => {
  it("shows the empty-query prompt and doesn't fetch posts", async () => {
    mockDefaults();
    renderPage();
    await screen.findByText("Enter a search term above.");
    expect(plainMock.history.get.find((c) => c.url === "/posts/any")).toBeUndefined();
  });

  it("navigates back on Back click", async () => {
    mockDefaults();
    renderPage();
    await screen.findByText("Enter a search term above.");
    fireEvent.click(screen.getByText("Back"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

describe("GlobalSearchPage — app page results", () => {
  it("matches a site route by a literal keyword substring", async () => {
    initialEntry = "/search?q=community";
    mockDefaults();
    renderPage();
    await screen.findByText("App Pages");
    expect(screen.getByText("Community")).toBeInTheDocument();
  });

  it("matches a site route via multi-token AND logic, not literal substring", async () => {
    // "batangas" and "latch" both appear in Latch Types' subtitle/keywords, but
    // never as the literal substring "batangas latch" (comma+space between them).
    initialEntry = "/search?q=batangas%20latch";
    mockDefaults();
    renderPage();
    await screen.findByText("App Pages");
    expect(screen.getByText("Latch Types")).toBeInTheDocument();
  });

  it("navigates to the matched route's path on click", async () => {
    initialEntry = "/search?q=community";
    mockDefaults();
    renderPage();
    const card = await screen.findByText("Community");
    fireEvent.click(card.closest("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/community");
  });
});

describe("GlobalSearchPage — trick results", () => {
  it("matches a trick by its name", async () => {
    initialEntry = "/search?q=rollout";
    mockDefaults();
    renderPage();
    await screen.findByText("Tricks");
    expect(screen.getByText("Double Rollout")).toBeInTheDocument();
  });

  it("matches a trick via an alias (case-insensitive)", async () => {
    initialEntry = "/search?q=dr";
    mockDefaults();
    renderPage();
    await screen.findByText("Tricks");
    expect(screen.getByText("Double Rollout")).toBeInTheDocument();
  });

  it("matches a trick alias via multi-token AND logic, not literal substring", async () => {
    // alias "double roll out" contains both tokens "double" and "out" but never
    // the literal substring "double out".
    initialEntry = "/search?q=double%20out";
    mockDefaults();
    renderPage();
    await screen.findByText("Tricks");
    expect(screen.getByText("Double Rollout")).toBeInTheDocument();
  });

  it("navigates to the trick's tutorial page on click", async () => {
    initialEntry = "/search?q=rollout";
    mockDefaults();
    renderPage();
    const card = await screen.findByText("Double Rollout");
    fireEvent.click(card.closest("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/beginner/double-rollout");
  });

  it("shows the no-matches message when neither pages nor tricks match", async () => {
    initialEntry = "/search?q=zzzznomatchzzzz";
    mockDefaults();
    renderPage();
    await screen.findByText("No pages or tricks matched.");
    expect(screen.queryByText("App Pages")).not.toBeInTheDocument();
    expect(screen.queryByText("Tricks")).not.toBeInTheDocument();
  });
});

describe("GlobalSearchPage — user results", () => {
  it("renders matched users and navigates to their profile on click", async () => {
    initialEntry = "/search?q=someuser";
    plainMock.onGet("/catalog/any/knives").reply(200, []);
    plainMock.onGet("/catalog/any/makers").reply(200, []);
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    plainMock.onGet("/accounts/any/search").reply((config) => {
      expect(config.params).toMatchObject({ q: "someuser" });
      return [200, [makeUser({ displayName: "someuser", identifierCode: "1234" })]];
    });
    renderPage();
    const card = await screen.findByText("someuser");
    fireEvent.click(card.closest("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/someuser/1234");
  });

  it("hides the Users section when there are no matches", async () => {
    initialEntry = "/search?q=zzzznomatchzzzz";
    mockDefaults();
    renderPage();
    await screen.findByText("No pages or tricks matched.");
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });
});

describe("GlobalSearchPage — knife results", () => {
  it("renders matched knives and navigates to the knife page on click", async () => {
    initialEntry = "/search?q=knife";
    plainMock.onGet("/accounts/any/search").reply(200, []);
    plainMock.onGet("/catalog/any/makers").reply(200, []);
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    plainMock.onGet("/catalog/any/knives").reply((config) => {
      expect(config.params).toMatchObject({ search: "knife" });
      return [200, [makeKnife({ slug: "knife-1", name: "Knife One" })]];
    });
    renderPage();
    const card = await screen.findByText("Knife One");
    fireEvent.click(card.closest("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/product-world/knife/knife-1");
  });
});

describe("GlobalSearchPage — maker results", () => {
  it("filters the full maker list client-side by name", async () => {
    initialEntry = "/search?q=acme";
    plainMock.onGet("/accounts/any/search").reply(200, []);
    plainMock.onGet("/catalog/any/knives").reply(200, []);
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    plainMock.onGet("/catalog/any/makers").reply(200, [
      makeMaker({ slug: "maker-1", name: "Acme Knives" }),
      makeMaker({ slug: "maker-2", name: "Other Co" }),
    ]);
    renderPage();
    await screen.findByText("Makers");
    expect(screen.getByText("Acme Knives")).toBeInTheDocument();
    expect(screen.queryByText("Other Co")).not.toBeInTheDocument();
  });

  it("matches a maker by country", async () => {
    initialEntry = "/search?q=usa";
    plainMock.onGet("/accounts/any/search").reply(200, []);
    plainMock.onGet("/catalog/any/knives").reply(200, []);
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    plainMock.onGet("/catalog/any/makers").reply(200, [makeMaker({ slug: "maker-1", name: "Acme Knives", country: "USA" })]);
    renderPage();
    const card = await screen.findByText("Acme Knives");
    fireEvent.click(card.closest("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/product-world/maker/maker-1");
  });
});

describe("GlobalSearchPage — community posts", () => {
  it("prompts to enter a query instead of fetching when there is none", async () => {
    mockDefaults();
    renderPage();
    await screen.findByText("Enter a search term above.");
  });

  it("shows loading then renders posts", async () => {
    initialEntry = "/search?q=rollout";
    plainMock.onGet("/accounts/any/search").reply(200, []);
    plainMock.onGet("/catalog/any/knives").reply(200, []);
    plainMock.onGet("/catalog/any/makers").reply(200, []);
    plainMock.onGet("/posts/any").reply((config) => {
      expect(config.params).toMatchObject({ page: 0, size: 15, search: "rollout" });
      return [200, { content: [makePost({ id: "1" }), makePost({ id: "2" })], totalPages: 1 }];
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
    expect(screen.getByText("feedcard:2")).toBeInTheDocument();
  });

  it("shows the empty state when there are no posts", async () => {
    initialEntry = "/search?q=rollout";
    mockDefaults();
    renderPage();
    await screen.findByText('No posts found for "rollout".');
  });

  it("shows an error state with a retry button on fetch failure", async () => {
    initialEntry = "/search?q=rollout";
    plainMock.onGet("/accounts/any/search").reply(200, []);
    plainMock.onGet("/catalog/any/knives").reply(200, []);
    plainMock.onGet("/catalog/any/makers").reply(200, []);
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");

    plainMock.onGet("/posts/any").reply(200, { content: [makePost({ id: "1" })], totalPages: 1 });
    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
  });

  it("loads the next page via Load more", async () => {
    initialEntry = "/search?q=rollout";
    plainMock.onGet("/accounts/any/search").reply(200, []);
    plainMock.onGet("/catalog/any/knives").reply(200, []);
    plainMock.onGet("/catalog/any/makers").reply(200, []);
    plainMock.onGet("/posts/any").reply((config) => {
      const page = config.params.page;
      if (page === 0) return [200, { content: [makePost({ id: "1" })], totalPages: 2 }];
      return [200, { content: [makePost({ id: "2" })], totalPages: 2 }];
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Load more"));
    await waitFor(() => expect(screen.getByText("feedcard:2")).toBeInTheDocument());
  });

  it("does not auto-retry a failed fetch (manual pagination only, no infinite scroll)", async () => {
    initialEntry = "/search?q=rollout";
    plainMock.onGet("/accounts/any/search").reply(200, []);
    plainMock.onGet("/catalog/any/knives").reply(200, []);
    plainMock.onGet("/catalog/any/makers").reply(200, []);
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");
    const callCountAfterFirstFailure = plainMock.history.get.filter((c) => c.url === "/posts/any").length;
    await new Promise((r) => setTimeout(r, 50));
    expect(plainMock.history.get.filter((c) => c.url === "/posts/any").length).toBe(callCountAfterFirstFailure);
  });
});

describe("GlobalSearchPage — search input", () => {
  it("submits a query on Enter, updating the URL-driven results", async () => {
    mockDefaults();
    renderPage();
    await screen.findByText("Enter a search term above.");

    const input = screen.getByPlaceholderText("Search anything...");
    fireEvent.change(input, { target: { value: "community" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await screen.findByText("App Pages");
    expect(screen.getByText("Community")).toBeInTheDocument();
  });

  it("does not submit a blank/whitespace-only query", async () => {
    mockDefaults();
    renderPage();
    await screen.findByText("Enter a search term above.");

    const input = screen.getByPlaceholderText("Search anything...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Enter a search term above.")).toBeInTheDocument();
  });

  it("clears only the input's draft value, not the submitted query results", async () => {
    initialEntry = "/search?q=community";
    mockDefaults();
    renderPage();
    await screen.findByText("App Pages");

    const input = screen.getByPlaceholderText("Search anything...") as HTMLInputElement;
    expect(input.value).toBe("community");

    fireEvent.click(document.querySelector(".fa-xmark")!.closest("button")!);

    expect(input.value).toBe("");
    // Results are still driven by the URL's ?q=, unaffected by clearing the draft input.
    expect(screen.getByText("App Pages")).toBeInTheDocument();
  });
});
