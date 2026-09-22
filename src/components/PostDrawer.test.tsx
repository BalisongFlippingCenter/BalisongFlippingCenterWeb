import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { PostDetail } from "../modals/Post";
import PostDrawer from "./PostDrawer";

vi.mock("./FeedPostCard", () => ({ default: ({ post }: { post: PostDetail }) => <div>post-card:{post.creatorDisplayName}</div> }));
vi.mock("./CommentsSection", () => ({ default: () => <div>comments-section-stub</div> }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function makePost(overrides: Partial<PostDetail> = {}): PostDetail {
  return {
    id: "1",
    accountId: "acc-1",
    postType: "GENERIC",
    caption: "hi",
    description: null,
    mediaFiles: [],
    tags: [],
    creatorDisplayName: "Someone",
    creatorIdentifierCode: "1234",
    creatorProfileImg: null,
    creationDate: new Date().toISOString(),
    likes: 0,
    comments: 0,
    mode: null,
    price: null,
    offeringKnife: null,
    lookingForText: null,
    lookingForImageUrl: null,
    difficultyTag: null,
    techniqueTags: [],
    referenceKnife: null,
    isPrivate: false,
    isAnnouncement: false,
    ...overrides,
  };
}

function renderDrawer(props: Partial<React.ComponentProps<typeof PostDrawer>> = {}) {
  return render(
    <MemoryRouter>
      <PostDrawer postId="1" {...props} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  document.body.style.overflow = "";
});

describe("PostDrawer — with a post already provided", () => {
  it("skips fetching and renders immediately", () => {
    renderDrawer({ post: makePost() });
    expect(screen.getByText("post-card:Someone")).toBeInTheDocument();
    expect(plainMock.history.get.length).toBe(0);
  });

  it("shows the creator in the header once loaded", () => {
    renderDrawer({ post: makePost({ creatorDisplayName: "HeaderUser" }) });
    expect(screen.getByText("HeaderUser")).toBeInTheDocument();
  });
});

describe("PostDrawer — fetching a post", () => {
  it("shows the skeleton while loading, then the post", async () => {
    plainMock.onGet("/posts/any/1").reply(200, { post: makePost({ creatorDisplayName: "Fetched" }) });
    renderDrawer();
    expect(screen.getByText("Post")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("post-card:Fetched")).toBeInTheDocument());
  });

  it("shows an error state and Go back on fetch failure", async () => {
    plainMock.onGet("/posts/any/1").reply(500);
    renderDrawer();
    await screen.findByText("Failed to load post.");
    fireEvent.click(screen.getByText("Go back"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

describe("PostDrawer — close", () => {
  it("navigates back when the close button is clicked", () => {
    renderDrawer({ post: makePost() });
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

describe("PostDrawer — body scroll lock", () => {
  it("locks scroll on mount and restores it on unmount", () => {
    const { unmount } = renderDrawer({ post: makePost() });
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
