import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import CommentLikeButton from "./CommentLikeButton";

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderButton(
  props: Partial<React.ComponentProps<typeof CommentLikeButton>> = {},
  loggedIn = true,
  likedCommentIds: number[] = [],
) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile({ likedCommentIds }) : null);
  setStore(store as any);
  return renderWithProviders(<CommentLikeButton postId={1} commentId={5} initialCount={0} {...props} />, store as any);
}

beforeEach(() => {
  authMock.reset();
});

describe("CommentLikeButton", () => {
  it("hides the count when it is zero", () => {
    renderButton({ initialCount: 0 });
    expect(screen.getByRole("button")).not.toHaveTextContent(/\d/);
  });

  it("shows the count once greater than zero", () => {
    renderButton({ initialCount: 2 });
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("optimistically likes, posts to the API, and updates the store", async () => {
    authMock.onPost("/posts/1/comments/5/like").reply(200);
    const { store } = renderButton({ initialCount: 0 });
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(store.getState().auth.user?.likedCommentIds).toContain(5);
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });

  it("rolls back on request failure", async () => {
    authMock.onPost("/posts/1/comments/5/like").reply(500);
    renderButton({ initialCount: 0 });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.queryByText("1")).not.toBeInTheDocument());
  });

  it("does nothing when not logged in", () => {
    renderButton({ initialCount: 0 }, false);
    fireEvent.click(screen.getByRole("button"));
    expect(authMock.history.post.length).toBe(0);
  });

  it("does nothing when the viewer owns the comment", () => {
    renderButton({ initialCount: 0, isOwner: true });
    fireEvent.click(screen.getByRole("button"));
    expect(authMock.history.post.length).toBe(0);
  });
});
