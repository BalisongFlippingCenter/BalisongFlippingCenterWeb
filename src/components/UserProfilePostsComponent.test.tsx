import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import UserProfilePostsComponent from "./UserProfilePostsComponent";

vi.mock("./ProfilePostCover", () => ({
  default: ({ post }: any) => <div>post:{post.id}:{post.identifier}</div>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeRawPost(id: string, overrides: Partial<any> = {}) {
  return {
    id,
    caption: null,
    coverFile: null,
    comments: 0,
    likes: 0,
    identifier: "GENERIC",
    mediaCount: 1,
    creationDate: null,
    isPrivate: false,
    isAnnouncement: false,
    ...overrides,
  };
}

function renderComponent() {
  const store = makeTestStore("tok", makeProfile({ id: "user-1" }));
  setStore(store as any);
  return renderWithProviders(<UserProfilePostsComponent />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("UserProfilePostsComponent — loading", () => {
  it("shows posts once fetched", async () => {
    authMock.onGet("/posts/any").reply(200, { content: [makeRawPost("1")], totalPages: 1 });
    renderComponent();
    await screen.findByText("post:1:GENERIC");
  });

  it("shows an error state and retries on click", async () => {
    authMock.onGet("/posts/any").replyOnce(500).onGet("/posts/any").reply(200, { content: [makeRawPost("1")], totalPages: 1 });
    renderComponent();
    await screen.findByText("Failed to load posts.");
    fireEvent.click(screen.getByText("Try again"));
    await screen.findByText("post:1:GENERIC");
  });

  it("shows the empty state with a create-post CTA", async () => {
    authMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderComponent();
    await screen.findByText("No posts yet.");
    fireEvent.click(screen.getByText("Create a post"));
    expect(mockNavigate).toHaveBeenCalledWith("/create-post");
  });
});

describe("UserProfilePostsComponent — filter", () => {
  it("filters posts by the selected identifier", async () => {
    authMock.onGet("/posts/any").reply(200, {
      content: [makeRawPost("1", { identifier: "Sell/Trade" }), makeRawPost("2", { identifier: "Collection" })],
      totalPages: 1,
    });
    renderComponent();
    await screen.findByText("post:1:Sell/Trade");

    fireEvent.click(screen.getByText("All"));
    fireEvent.click(screen.getByText("Sell/Trade"));

    expect(screen.getByText("post:1:Sell/Trade")).toBeInTheDocument();
    expect(screen.queryByText("post:2:Collection")).not.toBeInTheDocument();
  });
});

describe("UserProfilePostsComponent — sort", () => {
  it("sorts by most liked", async () => {
    authMock.onGet("/posts/any").reply(200, {
      content: [makeRawPost("low", { likes: 1 }), makeRawPost("high", { likes: 99 })],
      totalPages: 1,
    });
    renderComponent();
    await screen.findByText("post:low:GENERIC");

    fireEvent.click(screen.getByText("Newest"));
    fireEvent.click(screen.getByText("Most Liked"));

    const rendered = screen.getAllByText(/^post:/).map((el) => el.textContent);
    expect(rendered[0]).toBe("post:high:GENERIC");
  });
});

describe("UserProfilePostsComponent — pagination", () => {
  it("loads the next page and appends results", async () => {
    authMock.onGet("/posts/any").reply((config) => {
      if (config.params.page === 0) return [200, { content: [makeRawPost("1")], totalPages: 2 }];
      return [200, { content: [makeRawPost("2")], totalPages: 2 }];
    });
    renderComponent();
    await screen.findByText("post:1:GENERIC");
    fireEvent.click(screen.getByText("Load More"));
    await screen.findByText("post:2:GENERIC");
    expect(screen.getByText("post:1:GENERIC")).toBeInTheDocument();
  });
});

describe("UserProfilePostsComponent — liked tab", () => {
  it("fetches liked posts only when the Liked tab is first opened", async () => {
    authMock.onGet("/posts/any").reply(200, { content: [makeRawPost("1")], totalPages: 1 });
    authMock.onGet("/posts/me/liked").reply(200, { content: [makeRawPost("liked-1")], totalPages: 1 });
    renderComponent();
    await screen.findByText("post:1:GENERIC");
    expect(authMock.history.get.filter((r) => r.url === "/posts/me/liked").length).toBe(0);

    fireEvent.click(screen.getByText("Liked"));
    await screen.findByText("post:liked-1:GENERIC");
    expect(authMock.history.get.filter((r) => r.url === "/posts/me/liked").length).toBe(1);

    fireEvent.click(screen.getByText("Posts"));
    fireEvent.click(screen.getByText("Liked"));
    expect(authMock.history.get.filter((r) => r.url === "/posts/me/liked").length).toBe(1);
  });
});
