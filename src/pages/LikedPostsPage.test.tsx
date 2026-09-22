import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore } from "../test/testStore";
import LikedPostsPage from "./LikedPostsPage";

vi.mock("../components/ProfilePostCover", () => ({
  default: ({ post }: { post: { id: string } }) => <div data-testid="post-cover">{post.id}</div>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
  setStore(makeTestStore() as any);
});

describe("LikedPostsPage", () => {
  it("shows an empty state when there are no liked posts", async () => {
    authMock.onGet("/posts/me/liked").reply(200, { content: [], totalPages: 1 });
    renderWithProviders(<LikedPostsPage />);
    await screen.findByText("No liked posts yet.");
  });

  it("renders a cover for each liked post and the post count", async () => {
    authMock.onGet("/posts/me/liked").reply(200, {
      content: [{ id: "p1" }, { id: "p2" }],
      totalPages: 1,
    });
    renderWithProviders(<LikedPostsPage />);
    await screen.findByText("2 posts");
    expect(screen.getAllByTestId("post-cover")).toHaveLength(2);
  });

  it("shows a retry option when the fetch fails, and clears the error on retry", async () => {
    authMock.onGet("/posts/me/liked").reply(500);
    renderWithProviders(<LikedPostsPage />);
    await screen.findByText("Failed to load liked posts.");

    authMock.onGet("/posts/me/liked").reply(200, { content: [{ id: "p1" }], totalPages: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("1 post");
  });

  it("shows a Load More button when more pages are available, and appends the next page", async () => {
    authMock.onGet("/posts/me/liked").reply((config) => {
      if (config.params.page === 0) {
        return [200, { content: [{ id: "p1" }], totalPages: 2 }];
      }
      return [200, { content: [{ id: "p2" }], totalPages: 2 }];
    });
    renderWithProviders(<LikedPostsPage />);
    await screen.findByText("1 post");
    fireEvent.click(screen.getByRole("button", { name: "Load More" }));

    await waitFor(() => expect(screen.getAllByTestId("post-cover")).toHaveLength(2));
    expect(screen.queryByRole("button", { name: "Load More" })).not.toBeInTheDocument();
  });

  it("navigates back when the back button is clicked", async () => {
    authMock.onGet("/posts/me/liked").reply(200, { content: [], totalPages: 1 });
    renderWithProviders(<LikedPostsPage />);
    await screen.findByText("No liked posts yet.");
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
