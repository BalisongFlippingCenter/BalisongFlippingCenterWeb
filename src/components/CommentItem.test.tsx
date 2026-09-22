import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance, axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import { Comment } from "../modals/Comment";
import CommentItem from "./CommentItem";

const plainMock = new MockAdapter(axiosApiInstance);
const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    postId: 10,
    creationDate: new Date().toISOString(),
    creatorId: "author-1",
    creatorDisplayName: "Author",
    creatorIdentifierCode: "1234",
    creatorProfileImg: null,
    content: "original comment",
    likes: 0,
    replyCount: 0,
    ...overrides,
  };
}

function renderItem(
  comment: Comment,
  { viewerId = "viewer-1", onReply = vi.fn(), onDelete = vi.fn(), depth = 0 }: Partial<{
    viewerId: string | null;
    onReply: (id: number, content: string) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    depth: number;
  }> = {},
) {
  const store = makeTestStore(viewerId ? "tok" : null, viewerId ? makeProfile({ id: viewerId }) : null);
  setStore(store as any);
  return {
    onReply,
    onDelete,
    ...renderWithProviders(
      <CommentItem postId={10} comment={comment} onReply={onReply} onDelete={onDelete} depth={depth} />,
      store as any,
    ),
  };
}

beforeEach(() => {
  plainMock.reset();
  authMock.reset();
});

describe("CommentItem — action visibility", () => {
  it("shows Edit/Delete for the comment's owner, and no Report button", () => {
    renderItem(makeComment({ creatorId: "viewer-1" }), { viewerId: "viewer-1" });
    expect(document.querySelector(".fa-pen-to-square")).not.toBeNull();
    expect(document.querySelector(".fa-trash")).not.toBeNull();
    expect(screen.queryByTitle("Report comment")).not.toBeInTheDocument();
  });

  it("shows Report for a non-owner viewer, and no Edit/Delete", () => {
    renderItem(makeComment({ creatorId: "author-1" }), { viewerId: "viewer-1" });
    expect(screen.getByTitle("Report comment")).toBeInTheDocument();
    expect(document.querySelector(".fa-trash")).toBeNull();
  });

  it("hides Report (but not Reply) for a deleted account's comment", () => {
    renderItem(makeComment({ creatorDisplayName: "[deleted]" }), { viewerId: "viewer-1" });
    expect(screen.getByText("Reply")).toBeInTheDocument();
    expect(screen.queryByTitle("Report comment")).not.toBeInTheDocument();
  });

  it("hides all actions requiring a user when logged out, but still shows like count", () => {
    renderItem(makeComment(), { viewerId: null });
    expect(screen.queryByText("Reply")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Report comment")).not.toBeInTheDocument();
  });

  it("hides the Reply button at nested depth", () => {
    renderItem(makeComment(), { viewerId: "viewer-1", depth: 1 });
    expect(screen.queryByText("Reply")).not.toBeInTheDocument();
  });
});

describe("CommentItem — editing", () => {
  it("submits the edit, updates the displayed content, and exits edit mode", async () => {
    authMock.onPut("/posts/10/comments/1").reply(200);
    renderItem(makeComment({ creatorId: "viewer-1", content: "original comment" }), { viewerId: "viewer-1" });
    fireEvent.click(document.querySelector(".fa-pen-to-square")!.closest("button")!);

    const input = screen.getByPlaceholderText("Edit your comment...");
    fireEvent.change(input, { target: { value: "updated comment" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => expect(screen.getByText("updated comment")).toBeInTheDocument());
    expect(screen.queryByPlaceholderText("Edit your comment...")).not.toBeInTheDocument();
  });

  it("cancelling the edit restores the original view without saving", () => {
    renderItem(makeComment({ creatorId: "viewer-1", content: "original comment" }), { viewerId: "viewer-1" });
    fireEvent.click(document.querySelector(".fa-pen-to-square")!.closest("button")!);
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("original comment")).toBeInTheDocument();
    expect(authMock.history.put.length).toBe(0);
  });
});

describe("CommentItem — delete", () => {
  it("calls onDelete with the comment id", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderItem(makeComment({ creatorId: "viewer-1", id: 7 }), { viewerId: "viewer-1", onDelete });
    fireEvent.click(document.querySelector(".fa-trash")!.closest("button")!);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(7));
  });
});

describe("CommentItem — replies", () => {
  it("shows no replies toggle when replyCount is 0", () => {
    renderItem(makeComment({ replyCount: 0 }), { viewerId: "viewer-1" });
    expect(screen.queryByText(/reply|replies/)).not.toBeInTheDocument();
  });

  it("pluralizes the reply count correctly", () => {
    renderItem(makeComment({ replyCount: 1 }), { viewerId: "viewer-1" });
    expect(screen.getByText("View 1 reply")).toBeInTheDocument();
  });

  it("pluralizes multiple replies", () => {
    renderItem(makeComment({ replyCount: 3 }), { viewerId: "viewer-1" });
    expect(screen.getByText("View 3 replies")).toBeInTheDocument();
  });

  it("loads and displays nested replies on click, then hides them on second click", async () => {
    plainMock.onGet("/posts/any/10/comments/1/replies").reply(200, {
      content: [{ comment: makeComment({ id: 2, content: "a reply" }) }],
    });
    renderItem(makeComment({ id: 1, replyCount: 1 }), { viewerId: "viewer-1" });

    fireEvent.click(screen.getByText("View 1 reply"));
    await screen.findByText("a reply");
    expect(screen.getByText("Hide replies")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide replies"));
    expect(screen.queryByText("a reply")).not.toBeInTheDocument();
  });

  it("does not refetch replies on the second open (cached after first load)", async () => {
    plainMock.onGet("/posts/any/10/comments/1/replies").reply(200, {
      content: [{ comment: makeComment({ id: 2, content: "a reply" }) }],
    });
    renderItem(makeComment({ id: 1, replyCount: 1 }), { viewerId: "viewer-1" });

    fireEvent.click(screen.getByText("View 1 reply"));
    await screen.findByText("a reply");
    fireEvent.click(screen.getByText("Hide replies"));
    fireEvent.click(screen.getByText("View 1 reply"));

    await waitFor(() => expect(screen.getByText("a reply")).toBeInTheDocument());
    expect(plainMock.history.get.length).toBe(1);
  });
});

describe("CommentItem — replying", () => {
  it("posts a reply, increments the visible reply count, and shows the new reply", async () => {
    const onReply = vi.fn().mockResolvedValue(undefined);
    plainMock.onGet("/posts/any/10/comments/1/replies").reply(200, {
      content: [{ comment: makeComment({ id: 3, content: "my reply" }) }],
    });
    renderItem(makeComment({ id: 1, replyCount: 0 }), { viewerId: "viewer-1", onReply });

    fireEvent.click(screen.getByText("Reply"));
    fireEvent.change(screen.getByPlaceholderText(/Reply to Author/), { target: { value: "my reply" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => expect(onReply).toHaveBeenCalledWith(1, "my reply"));
    // Posting a reply auto-expands the (now freshly fetched) reply list.
    await screen.findByText("my reply");
    expect(screen.getByText("Hide replies")).toBeInTheDocument();
  });
});
