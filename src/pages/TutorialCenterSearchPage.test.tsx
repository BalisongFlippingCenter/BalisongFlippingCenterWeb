import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import TutorialCenterSearchPage from "./TutorialCenterSearchPage";

vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div>feedcard:{post.id}</div>,
}));
vi.mock("../components/TutorialCenterPageBackground", () => ({ default: () => <div /> }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

let initialEntry = "/tutorial-center/search";

function makePost(overrides: Partial<any> = {}) {
  return {
    post: { id: "1", postType: "TRICK_TUTORIAL", caption: "A tutorial", ...overrides },
    author: { displayName: "Author", identifierCode: "1234" },
  };
}

function renderPage() {
  const store = makeTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TutorialCenterSearchPage />
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  initialEntry = "/tutorial-center/search";
});

describe("TutorialCenterSearchPage — no query", () => {
  it("prompts for a search term and doesn't fetch posts", async () => {
    renderPage();
    await screen.findByText("Enter a search term to find posts.");
    expect(plainMock.history.get.find((c) => c.url === "/posts/any")).toBeUndefined();
  });

  it("navigates back to Tutorial Center", async () => {
    renderPage();
    await screen.findByText("Enter a search term to find posts.");
    fireEvent.click(screen.getByText("Tutorial Center"));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center");
  });
});

describe("TutorialCenterSearchPage — post feed", () => {
  it("shows a loading state then renders posts", async () => {
    initialEntry = "/tutorial-center/search?q=rollout";
    plainMock.onGet("/posts/any").reply(200, { content: [makePost({ id: "1" }), makePost({ id: "2" })], totalPages: 1 });
    renderPage();
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
    expect(screen.getByText("feedcard:2")).toBeInTheDocument();
  });

  it("does not client-side filter by post type — trusts the server-side postType param", async () => {
    initialEntry = "/tutorial-center/search?q=rollout";
    plainMock.onGet("/posts/any").reply(200, { content: [makePost({ id: "1", postType: "GENERIC" })], totalPages: 1 });
    renderPage();
    await screen.findByText("feedcard:1");
  });

  it("shows an error state with a retry button when the fetch fails", async () => {
    initialEntry = "/tutorial-center/search?q=rollout";
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    initialEntry = "/tutorial-center/search?q=rollout";
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText('No posts found for "rollout".');
  });

  it("loads the next page and appends results", async () => {
    initialEntry = "/tutorial-center/search?q=rollout";
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

  it("passes the type and difficulty filters as postType/difficultyTag", async () => {
    initialEntry = "/tutorial-center/search?q=rollout&type=COMBO&difficulty=ADVANCED";
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await waitFor(() => {
      const call = plainMock.history.get.find((c) => c.url === "/posts/any");
      expect((call?.params as any)?.postType).toBe("COMBO");
      expect((call?.params as any)?.difficultyTag).toBe("ADVANCED");
    });
  });
});

describe("TutorialCenterSearchPage — filter chips", () => {
  it("switching the type filter refetches with the new postType", async () => {
    initialEntry = "/tutorial-center/search?q=rollout";
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText('No posts found for "rollout".');

    fireEvent.click(screen.getByText("Combo"));

    await waitFor(() => {
      const call = plainMock.history.get.filter((c) => c.url === "/posts/any").at(-1);
      expect((call?.params as any)?.postType).toBe("COMBO");
    });
  });

  it("switching the difficulty filter refetches with the new difficultyTag", async () => {
    initialEntry = "/tutorial-center/search?q=rollout";
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText('No posts found for "rollout".');

    fireEvent.click(screen.getByText("Beginner"));

    await waitFor(() => {
      const call = plainMock.history.get.filter((c) => c.url === "/posts/any").at(-1);
      expect((call?.params as any)?.difficultyTag).toBe("BEGINNER");
    });
  });
});

describe("TutorialCenterSearchPage — trick matches", () => {
  it("shows a matching trick by alias and navigates on click", async () => {
    initialEntry = "/tutorial-center/search?q=rollout";
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();

    await waitFor(() => expect(screen.getByText("Trick Pages")).toBeInTheDocument());
    expect(screen.getByText("Double Rollout")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Double Rollout"));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/beginner/double-rollout");
  });

  it("hides the trick section when nothing matches", async () => {
    initialEntry = "/tutorial-center/search?q=zzz-nomatch";
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();

    await screen.findByText('No posts found for "zzz-nomatch".');
    expect(screen.queryByText("Trick Pages")).not.toBeInTheDocument();
  });
});

describe("TutorialCenterSearchPage — search input", () => {
  it("shows the current query in the results header", async () => {
    initialEntry = "/tutorial-center/search?q=fan";
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    await screen.findByText('"fan"');
  });

  it("submits a trimmed query on Enter, updating the URL", async () => {
    renderPage();
    await screen.findByText("Enter a search term to find posts.");

    const input = screen.getByPlaceholderText("Search tricks, tutorials, combos...");
    fireEvent.change(input, { target: { value: "  twirl  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    await screen.findByText('"twirl"');
  });

  it("does not submit a blank/whitespace-only query", async () => {
    renderPage();
    await screen.findByText("Enter a search term to find posts.");

    const input = screen.getByPlaceholderText("Search tricks, tutorials, combos...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Enter a search term to find posts.")).toBeInTheDocument();
  });

  it("clears the input via the X button", async () => {
    initialEntry = "/tutorial-center/search?q=fan";
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage();
    const input = await screen.findByPlaceholderText("Search tricks, tutorials, combos...");
    expect(input).toHaveValue("fan");

    fireEvent.click(document.querySelector(".fa-xmark")!.closest("button")!);
    expect(input).toHaveValue("");
  });
});
