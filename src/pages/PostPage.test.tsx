import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import PostPage from "./PostPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div data-testid="feed-post-card">{post.caption}</div>,
}));
vi.mock("../components/CommentsSection", () => ({
  default: () => <div data-testid="comments-section" />,
}));

const plainMock = new MockAdapter(axiosApiInstance);

function renderAt(postId: string, search = "") {
  const store = makeTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/post/${postId}${search}`]}>
        <Routes>
          <Route path="/post/:postId" element={<PostPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("PostPage", () => {
  it("shows a loading skeleton before the post resolves", () => {
    plainMock.onGet("/posts/any/post-1").reply(() => new Promise(() => {}));
    const { container } = renderAt("post-1");
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders the post and comments section once loaded", async () => {
    plainMock.onGet("/posts/any/post-1").reply(200, { post: { id: "post-1", caption: "Hello world" } });
    renderAt("post-1");
    expect(await screen.findByTestId("feed-post-card")).toHaveTextContent("Hello world");
    expect(screen.getByTestId("comments-section")).toBeInTheDocument();
  });

  it("shows an error state and a way back when the fetch fails", async () => {
    plainMock.onGet("/posts/any/post-1").reply(500);
    renderAt("post-1");
    fireEvent.click(await screen.findByRole("button", { name: "Go back" }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("renders the post creator's name in the top bar once loaded", async () => {
    plainMock.onGet("/posts/any/post-1").reply(200, {
      post: { id: "post-1", caption: "Hi" },
      author: { displayName: "flipperguy", identifierCode: "42" },
    });
    renderAt("post-1");
    await screen.findByText("flipperguy");
    expect(screen.getByText("#42")).toBeInTheDocument();
  });
});
