import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import TrickTutorialPage from "./TrickTutorialPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div data-testid="feed-post-card">{post.caption}</div>,
}));

const plainMock = new MockAdapter(axiosApiInstance);

function renderAt(level: string, trickSlug: string) {
  const store = makeTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/tutorial-center/${level}/${trickSlug}`]}>
        <Routes>
          <Route path="/tutorial-center/:level/:trickSlug" element={<TrickTutorialPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  localStorage.clear();
});

describe("TrickTutorialPage", () => {
  it("shows a not-found message for an unknown trick", () => {
    renderAt("beginner", "not-a-real-trick");
    expect(screen.getByText("Trick not found.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Back to beginner tricks/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/beginner");
  });

  it("renders the trick's name, level badge, and description for a real trick", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    renderAt("beginner", "double-rollout");
    expect(screen.getByRole("heading", { name: "Double Rollout" })).toBeInTheDocument();
    expect(screen.getAllByText("beginner").length).toBeGreaterThan(0);
    expect(screen.getByText(/The foundational trick of balisong flipping/)).toBeInTheDocument();
    await screen.findByText("No community posts for this trick yet.");
  });

  it("renders the trick's tip callouts", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    renderAt("beginner", "double-rollout");
    expect(screen.getByText(/Gripping too tightly through the whole motion/)).toBeInTheDocument();
    expect(screen.getByText("Common mistake:")).toBeInTheDocument();
    await screen.findByText("No community posts for this trick yet.");
  });

  it("does not render a Learn Next section when the trick has no related tricks", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    renderAt("beginner", "double-rollout");
    expect(screen.queryByText("Learn Next")).not.toBeInTheDocument();
    await screen.findByText("No community posts for this trick yet.");
  });

  it("navigates back to the level's trick list", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    renderAt("beginner", "double-rollout");
    fireEvent.click(screen.getByRole("button", { name: /Beginner Tricks/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/beginner");
    await screen.findByText("No community posts for this trick yet.");
  });

  it("shows an empty state in the community feed when there are no posts", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    renderAt("beginner", "double-rollout");
    await screen.findByText("No community posts for this trick yet.");
  });

  it("renders posts in the community feed once fetched", async () => {
    plainMock.onGet("/posts/any").reply(200, {
      content: [{ id: "p1", caption: "Nice clean rollout" }],
      totalPages: 1,
    });
    renderAt("beginner", "double-rollout");
    expect(await screen.findByTestId("feed-post-card")).toHaveTextContent("Nice clean rollout");
  });

  it("requests posts filtered by the trick's name", async () => {
    plainMock.onGet("/posts/any").reply((config) => {
      expect(config.params.search).toBe("Double Rollout");
      return [200, { content: [] }];
    });
    renderAt("beginner", "double-rollout");
    await screen.findByText("No community posts for this trick yet.");
  });
});
