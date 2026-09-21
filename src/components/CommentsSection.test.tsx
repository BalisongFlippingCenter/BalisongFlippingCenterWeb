import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance, axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import CommentsSection from "./CommentsSection";

vi.mock("./CommentItem", () => ({
  default: ({ comment, onDelete }: any) => (
    <div>
      <span>{comment.content}</span>
      <button onClick={() => onDelete(comment.id)}>delete-{comment.id}</button>
    </div>
  ),
}));

const plainMock = new MockAdapter(axiosApiInstance);
const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeRawComment(id: number, content = `comment ${id}`) {
  return { comment: { id, postId: 1, creationDate: new Date().toISOString(), creatorId: "u1", content, likes: 0, replyCount: 0 }, author: { displayName: "Author", identifierCode: "1234" } };
}

function renderSection(props: Partial<React.ComponentProps<typeof CommentsSection>> = {}, loggedIn = true) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile() : null);
  setStore(store as any);
  return renderWithProviders(<CommentsSection postId="1" commentCount={0} {...props} />, store as any);
}

beforeEach(() => {
  plainMock.reset();
  authMock.reset();
});

describe("CommentsSection — loading and empty state", () => {
  it("shows the empty state once loaded with no comments", async () => {
    plainMock.onGet("/posts/any/1/comments").reply(200, { content: [] });
    renderSection();
    await screen.findByText("No comments yet. Be the first.");
  });

  it("silently shows the empty state when the fetch fails", async () => {
    plainMock.onGet("/posts/any/1/comments").reply(500);
    renderSection();
    await screen.findByText("No comments yet. Be the first.");
  });
});

describe("CommentsSection — auth gating", () => {
  it("shows the comment input when logged in", async () => {
    plainMock.onGet("/posts/any/1/comments").reply(200, { content: [] });
    renderSection({}, true);
    expect(screen.getByPlaceholderText("Write a comment...")).toBeInTheDocument();
  });

  it("shows a login prompt instead of the input when logged out", async () => {
    plainMock.onGet("/posts/any/1/comments").reply(200, { content: [] });
    renderSection({}, false);
    expect(screen.getByText("Log in to leave a comment.")).toBeInTheDocument();
  });
});

describe("CommentsSection — comment count", () => {
  it("shows the singular form for exactly one comment", async () => {
    plainMock.onGet("/posts/any/1/comments").reply(200, { content: [makeRawComment(1)], totalElements: 1 });
    renderSection();
    await screen.findByText("1 comment");
  });

  it("shows the plural form for more than one comment", async () => {
    plainMock.onGet("/posts/any/1/comments").reply(200, { content: [makeRawComment(1), makeRawComment(2)], totalElements: 2 });
    renderSection();
    await screen.findByText("2 comments");
  });

  it("notifies onTotalChange when the total changes from a user action (not on initial load)", async () => {
    const onTotalChange = vi.fn();
    plainMock.onGet("/posts/any/1/comments").reply(200, { content: [makeRawComment(1)], totalElements: 1 });
    authMock.onPost("/posts/1/comments").reply(200, makeRawComment(2, "new one").comment);
    renderSection({ onTotalChange });
    await screen.findByText("1 comment");
    expect(onTotalChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Write a comment..."), { target: { value: "new one" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => expect(onTotalChange).toHaveBeenCalledWith(2));
  });
});

describe("CommentsSection — posting", () => {
  it("prepends a new comment and increments the total", async () => {
    plainMock.onGet("/posts/any/1/comments").reply(200, { content: [makeRawComment(1)], totalElements: 1 });
    authMock.onPost("/posts/1/comments").reply(200, makeRawComment(2, "brand new").comment);
    renderSection();
    await screen.findByText("1 comment");

    fireEvent.change(screen.getByPlaceholderText("Write a comment..."), { target: { value: "brand new" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await screen.findByText("brand new");
    await screen.findByText("2 comments");
  });
});

describe("CommentsSection — deleting", () => {
  it("removes the comment and decrements the total", async () => {
    plainMock.onGet("/posts/any/1/comments").reply(200, { content: [makeRawComment(1), makeRawComment(2)], totalElements: 2 });
    authMock.onDelete("/posts/1/comments/1").reply(200);
    renderSection();
    await screen.findByText("2 comments");

    fireEvent.click(screen.getByText("delete-1"));

    await waitFor(() => expect(screen.queryByText("comment 1")).not.toBeInTheDocument());
    await screen.findByText("1 comment");
  });
});

describe("CommentsSection — pagination", () => {
  it("shows Load more only when a full page was returned, and appends on click", async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) => makeRawComment(i + 1));
    plainMock.onGet("/posts/any/1/comments").reply((config) => {
      if (config.params.page === 0) return [200, { content: fullPage, totalElements: 25 }];
      return [200, { content: [makeRawComment(21)], totalElements: 25 }];
    });
    renderSection();

    await screen.findByText("Load more comments");
    fireEvent.click(screen.getByText("Load more comments"));

    await screen.findByText("comment 21");
    expect(screen.queryByText("Load more comments")).not.toBeInTheDocument();
  });
});
