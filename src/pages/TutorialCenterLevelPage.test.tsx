import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import TutorialCenterLevelPage from "./TutorialCenterLevelPage";

vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div>feedcard:{post.id}</div>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function makePost(overrides: Partial<any> = {}) {
  return {
    post: { id: "1", postType: "TRICK_TUTORIAL", caption: "A trick", ...overrides },
    author: { displayName: "Someone", identifierCode: "1234" },
  };
}

function renderPage(level = "beginner") {
  const store = makeTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/tutorial-center/${level}`]}>
        <Routes>
          <Route path="/tutorial-center/:level" element={<TutorialCenterLevelPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("TutorialCenterLevelPage — level config", () => {
  it("renders the beginner level with no prev button and a next button", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage("beginner");
    await screen.findByText("No community posts at this level yet.");
    expect(screen.getByText("Beginner Tricks & Tutorials")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Beginner" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Intermediate/ })).toBeInTheDocument();
  });

  it("renders the intermediate level with both prev and next buttons", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage("intermediate");
    await screen.findByText("No community posts at this level yet.");
    expect(screen.getByText("Intermediate Tricks & Tutorials")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Beginner/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Advanced/ })).toBeInTheDocument();
  });

  it("renders the advanced level with a prev button and no next button", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage("advanced");
    await screen.findByText("No community posts at this level yet.");
    expect(screen.getByText("Advanced Tricks & Tutorials")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Intermediate/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Advanced/ })).not.toBeInTheDocument();
  });

  it("navigates to the next level on click", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage("beginner");
    await screen.findByText("No community posts at this level yet.");
    fireEvent.click(screen.getByRole("button", { name: /Intermediate/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/intermediate");
  });

  it("navigates to the prev level on click", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage("advanced");
    await screen.findByText("No community posts at this level yet.");
    fireEvent.click(screen.getByRole("button", { name: /Intermediate/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/intermediate");
  });

  it("navigates back to the Tutorial Center", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderPage("beginner");
    await screen.findByText("No community posts at this level yet.");
    fireEvent.click(screen.getByRole("button", { name: /Tutorial Center/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center");
  });

  it("shows a not-found state for an unknown level slug and does not fetch posts", async () => {
    renderPage("expert");
    await screen.findByText("Level not found.");
    expect(plainMock.history.get.find((c) => c.url === "/posts/any")).toBeUndefined();
    fireEvent.click(screen.getByText("Back to Tutorial Center"));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center");
  });
});

describe("TutorialCenterLevelPage — LevelFeed", () => {
  it("fetches with the level's difficultyTag and renders matching posts", async () => {
    plainMock.onGet("/posts/any").reply((config) => {
      expect(config.params).toMatchObject({ page: 0, size: 10, difficultyTag: "BEGINNER" });
      return [200, { content: [makePost({ id: "1" })], totalPages: 1 }];
    });
    renderPage("beginner");
    await screen.findByText("feedcard:1");
  });

  it("filters out post types other than COMBO/TRICK_TUTORIAL client-side", async () => {
    plainMock.onGet("/posts/any").reply(200, {
      content: [
        makePost({ id: "1", postType: "TRICK_TUTORIAL" }),
        makePost({ id: "2", postType: "COMBO" }),
        makePost({ id: "3", postType: "GENERIC" }),
      ],
      totalPages: 1,
    });
    renderPage("beginner");
    await screen.findByText("feedcard:1");
    expect(screen.getByText("feedcard:2")).toBeInTheDocument();
    expect(screen.queryByText("feedcard:3")).not.toBeInTheDocument();
  });

  it("shows an error state on fetch failure and does not auto-retry", async () => {
    plainMock.onGet("/posts/any").reply(500);
    renderPage("beginner");
    await screen.findByText("Failed to load posts.");
    await new Promise((r) => setTimeout(r, 50));
    expect(plainMock.history.get.filter((c) => c.url === "/posts/any")).toHaveLength(1);
  });

  it("retries only when Try again is clicked", async () => {
    plainMock.onGet("/posts/any").replyOnce(500);
    renderPage("beginner");
    await screen.findByText("Failed to load posts.");

    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    fireEvent.click(screen.getByText("Try again"));
    await screen.findByText("No community posts at this level yet.");
  });

  it("loads more posts on click and appends them", async () => {
    plainMock.onGet("/posts/any").reply((config) => {
      const page = config.params.page;
      const post = makePost({ id: String(page) });
      return [200, { content: [{ ...post }], totalPages: 2 }];
    });
    renderPage("beginner");
    await screen.findByText("feedcard:0");
    fireEvent.click(screen.getByText("Load more"));
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
    expect(screen.getByText("feedcard:0")).toBeInTheDocument();
  });

  it("hides Load more once the last page is reached", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [makePost({ id: "1" })], totalPages: 1 });
    renderPage("beginner");
    await screen.findByText("feedcard:1");
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });
});
