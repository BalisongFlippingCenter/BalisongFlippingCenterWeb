import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import CommunityPage from "./CommunityPage";

vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div>feedcard:{post.id}</div>,
}));

// jsdom can't measure real layout, so a real virtualizer would report an
// empty viewport. Default to that; opt in via virtualizerFull.value = true
// for tests that need actual rendered rows (mirrors ProductWorldPage.test.tsx).
const virtualizerFull = vi.hoisted(() => ({ value: false }));

vi.mock("@tanstack/react-virtual", () => ({
  useWindowVirtualizer: (opts: any) => ({
    getVirtualItems: () =>
      virtualizerFull.value
        ? Array.from({ length: opts.count }, (_, index) => ({
            key: index,
            index,
            start: index * 550,
          }))
        : [],
    getTotalSize: () => opts.count * 550,
    measureElement: () => {},
    options: { scrollMargin: opts.scrollMargin ?? 0 },
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function renderPage(loggedIn = false) {
  const store = makeTestStore(
    loggedIn ? "tok" : null,
    loggedIn ? makeProfile({ displayName: "flipperguy", identifierCode: "1234" }) : null,
  );
  return renderWithProviders(<CommunityPage />, store as any);
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  virtualizerFull.value = false;
});

describe("CommunityPage — feed loading/error/empty", () => {
  it("shows loading skeletons, then renders posts", async () => {
    virtualizerFull.value = true;
    plainMock.onGet("/posts/any").reply(200, { content: [{ id: "1" }, { id: "2" }], last: true });
    renderPage();
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
    expect(screen.getByText("feedcard:2")).toBeInTheDocument();
  });

  it("shows an error state with a retry option", async () => {
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("shows the caught-up message once every post has loaded", async () => {
    virtualizerFull.value = true;
    plainMock.onGet("/posts/any").reply(200, { content: [{ id: "1" }], last: true });
    renderPage();
    await screen.findByText("You're all caught up");
  });
});

describe("CommunityPage — create post prompt", () => {
  it("prompts a logged-out visitor to sign in", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], last: true });
    renderPage(false);
    const prompt = await screen.findByText("Share your flips with the community.");
    fireEvent.click(prompt.parentElement!.querySelector("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("lets a logged-in user open the create-post flow", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], last: true });
    renderPage(true);
    await screen.findByText("What are you flipping today?");
    fireEvent.click(screen.getByText("What are you flipping today?"));
    expect(mockNavigate).toHaveBeenCalledWith("/create-post");
  });
});

describe("CommunityPage — sidebar", () => {
  it("shows the logged-in user's mini profile card with a working View Profile link", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], last: true });
    renderPage(true);
    await screen.findByText("flipperguy");
    fireEvent.click(screen.getByText("View Profile →"));
    expect(mockNavigate).toHaveBeenCalledWith("/flipperguy/1234");
  });

  it("shows a Join the Community card for a logged-out visitor", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], last: true });
    renderPage(false);
    await screen.findByText("Join the Community");
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });

  it("changes the post-type filter and re-fetches with the new type", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], last: true });
    renderPage(false);
    await screen.findByText("Filters");

    fireEvent.click(screen.getByRole("button", { name: "Trade" }));
    await waitFor(() =>
      expect(plainMock.history.get.some((c) => c.url === "/posts/any" && c.params.postType === "TRADE")).toBe(true),
    );
  });

  it("shows a Reset control once a filter is active, which clears it", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [], last: true });
    renderPage(false);
    await screen.findByText("Filters");

    expect(screen.queryByText("Reset")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Trade" }));
    await screen.findByText("Reset");

    fireEvent.click(screen.getByText("Reset"));
    await waitFor(() => expect(screen.queryByText("Reset")).not.toBeInTheDocument());
  });
});
