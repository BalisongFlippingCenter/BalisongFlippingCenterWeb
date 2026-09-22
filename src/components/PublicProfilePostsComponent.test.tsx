import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import PublicProfilePostsComponent from "./PublicProfilePostsComponent";

vi.mock("./ProfilePostCover", () => ({
  default: ({ post }: any) => <div>post:{post.id}:{post.identifier}</div>,
}));

const plainMock = new MockAdapter(axiosApiInstance);

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

beforeEach(() => {
  plainMock.reset();
});

describe("PublicProfilePostsComponent", () => {
  it("fetches by the given accountId and renders posts", async () => {
    plainMock.onGet("/posts/any").reply((config) => {
      expect(config.params.accountId).toBe("acc-42");
      return [200, { content: [makeRawPost("1")], totalPages: 1 }];
    });
    renderWithProviders(<PublicProfilePostsComponent accountId="acc-42" />);
    await screen.findByText("post:1:GENERIC");
  });

  it("shows the empty state without a create-post CTA (public/read-only)", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
    renderWithProviders(<PublicProfilePostsComponent accountId="acc-42" />);
    await screen.findByText("No posts yet.");
    expect(screen.queryByText("Create a post")).not.toBeInTheDocument();
  });

  it("shows an error state and retries", async () => {
    plainMock.onGet("/posts/any").replyOnce(500).onGet("/posts/any").reply(200, { content: [makeRawPost("1")], totalPages: 1 });
    renderWithProviders(<PublicProfilePostsComponent accountId="acc-42" />);
    await screen.findByText("Failed to load posts.");
    fireEvent.click(screen.getByText("Try again"));
    await screen.findByText("post:1:GENERIC");
  });

  it("filters posts by identifier", async () => {
    plainMock.onGet("/posts/any").reply(200, {
      content: [makeRawPost("1", { identifier: "Flipping" }), makeRawPost("2", { identifier: "Collection" })],
      totalPages: 1,
    });
    renderWithProviders(<PublicProfilePostsComponent accountId="acc-42" />);
    await screen.findByText("post:1:Flipping");

    fireEvent.click(screen.getByText("All"));
    fireEvent.click(screen.getByText("Flipping"));

    expect(screen.getByText("post:1:Flipping")).toBeInTheDocument();
    expect(screen.queryByText("post:2:Collection")).not.toBeInTheDocument();
  });

  it("does not fetch when accountId is empty", () => {
    renderWithProviders(<PublicProfilePostsComponent accountId="" />);
    expect(plainMock.history.get.length).toBe(0);
  });
});
