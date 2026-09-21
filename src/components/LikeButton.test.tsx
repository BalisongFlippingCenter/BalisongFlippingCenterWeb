import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import LikeButton from "./LikeButton";

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderButton(props: Partial<React.ComponentProps<typeof LikeButton>> = {}, loggedIn = true, likedPostIds: number[] = []) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile({ likedPostIds }) : null);
  setStore(store as any);
  return renderWithProviders(<LikeButton postId="5" initialCount={3} {...props} />, store as any);
}

beforeEach(() => {
  authMock.reset();
});

describe("LikeButton", () => {
  it("initializes liked state from the user's likedPostIds", () => {
    renderButton({}, true, [5]);
    expect(screen.getByText("likes")).toHaveClass("text-red/70");
  });

  it("optimistically likes, posts to the API, and updates the store", async () => {
    authMock.onPost("/posts/5/like").reply(200);
    const { store } = renderButton();
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(store.getState().auth.user?.likedPostIds).toContain(5);
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });

  it("optimistically unlikes and sends a DELETE", async () => {
    authMock.onDelete("/posts/5/like").reply(200);
    renderButton({}, true, [5]);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("2")).toBeInTheDocument();
    await waitFor(() => expect(authMock.history.delete.length).toBe(1));
  });

  it("rolls back the optimistic update if the request fails", async () => {
    authMock.onPost("/posts/5/like").reply(500);
    const { store } = renderButton();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("4")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());
    expect(store.getState().auth.user?.likedPostIds).not.toContain(5);
  });

  it("does nothing when the viewer is not logged in", () => {
    renderButton({}, false);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(authMock.history.post.length).toBe(0);
  });

  it("does nothing when the viewer owns the post", () => {
    renderButton({ isOwner: true });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(authMock.history.post.length).toBe(0);
  });

  it("ignores a second click while a request is already in flight", async () => {
    authMock.onPost("/posts/5/like").reply(() => new Promise((resolve) => setTimeout(() => resolve([200]), 50)));
    renderButton();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });

  it("pluralizes the like count correctly", () => {
    renderButton({ initialCount: 1 });
    expect(screen.getByText("like")).toBeInTheDocument();
    expect(screen.queryByText("likes")).not.toBeInTheDocument();
  });
});
