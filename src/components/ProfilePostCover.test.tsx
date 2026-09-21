import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import { PostCover } from "../modals/Post";
import ProfilePostCover from "./ProfilePostCover";

function makePost(overrides: Partial<PostCover> = {}): PostCover {
  return {
    id: "1",
    caption: "a post",
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

function renderCover(post: PostCover, onOpen = vi.fn(), likedPostIds: number[] = []) {
  const store = makeTestStore("tok", makeProfile({ likedPostIds }));
  return { onOpen, ...renderWithProviders(<ProfilePostCover post={post} onOpen={onOpen} />, store as any) };
}

describe("ProfilePostCover — click", () => {
  it("calls onOpen with the post id", () => {
    const { container, onOpen } = renderCover(makePost({ id: "42" }));
    fireEvent.click(container.firstChild!);
    expect(onOpen).toHaveBeenCalledWith("42");
  });
});

describe("ProfilePostCover — media", () => {
  it("renders an <img> for a non-video S3 cover", () => {
    renderCover(makePost({ coverFile: "https://cdn/a.jpg" }));
    expect(document.querySelector("img")).not.toBeNull();
    expect(document.querySelector("video")).toBeNull();
  });

  it("renders a <video> and play badge for a video cover", () => {
    renderCover(makePost({ coverFile: "https://cdn/a.mp4" }));
    expect(document.querySelector("video")).not.toBeNull();
    expect(document.querySelector(".fa-play")).not.toBeNull();
  });

  it("falls back to a placeholder gradient when there is no S3 cover URL", () => {
    renderCover(makePost({ coverFile: null }));
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector("video")).toBeNull();
  });

  it("hides the multi-media badge for a single-media post", () => {
    renderCover(makePost({ mediaCount: 1 }));
    expect(document.querySelector(".fa-images")).toBeNull();
  });

  it("shows the media count badge for multiple files", () => {
    renderCover(makePost({ mediaCount: 3 }));
    expect(document.querySelector(".fa-images")).not.toBeNull();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("ProfilePostCover — badges", () => {
  it("shows the announcement badge", () => {
    renderCover(makePost({ isAnnouncement: true }));
    expect(document.querySelector(".fa-bullhorn")).not.toBeNull();
  });

  it("shows the private badge", () => {
    renderCover(makePost({ isPrivate: true }));
    expect(document.querySelector(".fa-lock")).not.toBeNull();
  });

  it("maps the post type identifier to its badge label", () => {
    renderCover(makePost({ identifier: "TRADE" }));
    expect(screen.getByText("Trade")).toBeInTheDocument();
  });
});

describe("ProfilePostCover — like state", () => {
  it("highlights the heart red when the viewer has liked the post", () => {
    renderCover(makePost({ id: "5", likes: 10 }), vi.fn(), [5]);
    expect(document.querySelector(".fa-heart")).toHaveClass("text-red");
  });

  it("does not highlight the heart when not liked", () => {
    renderCover(makePost({ id: "5", likes: 10 }), vi.fn(), []);
    expect(document.querySelector(".fa-heart")).toHaveClass("text-white/75");
  });

  it("formats large like/comment counts with locale separators", () => {
    renderCover(makePost({ likes: 12345, comments: 6789 }));
    expect(screen.getByText("12,345")).toBeInTheDocument();
    expect(screen.getByText("6,789")).toBeInTheDocument();
  });
});
