import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import LearnTopicPage from "./LearnTopicPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function renderAt(topic: string) {
  const store = makeTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/learn/${topic}`]}>
        <Routes>
          <Route path="/learn/:topic" element={<LearnTopicPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("LearnTopicPage — not found", () => {
  it("shows a not-found message and returns to /learn", () => {
    renderAt("not-a-real-topic");
    expect(screen.getByText("Topic not found.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to Learn" }));
    expect(mockNavigate).toHaveBeenCalledWith("/learn");
  });
});

describe("LearnTopicPage — 'What is a Balisong?' (video placeholder + list section)", () => {
  it("renders the header, a coming-soon video placeholder, and every list bullet", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    plainMock.onGet("/stats").reply(200, {});
    renderAt("what-is-a-balisong");

    expect(screen.getByRole("heading", { name: "What is a Balisong?" })).toBeInTheDocument();
    expect(screen.getByText("Video coming soon")).toBeInTheDocument();
    expect(screen.getByText(/The tactile satisfaction of a well-tuned/)).toBeInTheDocument();
    expect(screen.getByText(/The collector aspect/)).toBeInTheDocument();
    await screen.findByText(/Growing community/);
  });

  it("navigates back to /learn from the top and bottom back links", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    plainMock.onGet("/stats").reply(200, {});
    renderAt("what-is-a-balisong");

    const backLinks = screen.getAllByRole("button", { name: /All Topics/ });
    expect(backLinks.length).toBe(2);
    fireEvent.click(backLinks[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/learn");
    await screen.findByText(/Growing community/);
  });
});

describe("LearnTopicPage — 'Balisong Legality' (callout/list/status-list sections)", () => {
  it("renders the info callout, the US list, and status badges for each country", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    plainMock.onGet("/stats").reply(200, {});
    renderAt("balisong-legality");

    expect(screen.getByText(/Laws around balisongs change frequently/)).toBeInTheDocument();
    expect(screen.getByText(/Hawaii — Illegal to own or carry/)).toBeInTheDocument();

    expect(screen.getByText("Philippines")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(screen.getAllByText("Restricted").length).toBe(2);
    expect(screen.getAllByText("Illegal").length).toBe(3);

    await screen.findByText(/Growing community/);
  });

  it("renders the warning callout's ToS link", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    plainMock.onGet("/stats").reply(200, {});
    renderAt("balisong-legality");
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
    await screen.findByText(/Growing community/);
  });
});

describe("LearnTopicPage — 'How to Choose Your First Balisong' (tiered-list)", () => {
  it("keeps knives hidden until a budget tier is expanded", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    plainMock.onGet("/stats").reply(200, {});
    renderAt("how-to-choose-your-first-balisong");

    expect(screen.getByText("$50+")).toBeInTheDocument();
    expect(screen.queryByText("Nabalis Cheese")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("$50+"));
    const cheeseRow = screen.getByText("Nabalis Cheese").closest("div")!;
    expect(cheeseRow.querySelector('a[href*="nabalis.com"]')).toHaveAttribute(
      "href",
      "https://nabalis.com/products/cheese-the-first-cute-harmless-and-public-friendly-metal-trainer",
    );

    await screen.findByText(/Growing community/);
  });
});

describe("LearnTopicPage — community strip", () => {
  it("shows the explore-the-platform cards when the community strip has no posts", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    plainMock.onGet("/stats").reply(200, {});
    renderAt("what-is-a-balisong");
    await screen.findByText("Explore the platform");
  });

  it("hides the explore-the-platform cards once the community strip has posts", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [{ id: "p1", caption: "Nice knife" }] });
    plainMock.onGet("/stats").reply(200, {});
    renderAt("what-is-a-balisong");
    await waitFor(() => expect(plainMock.history.get.some((c) => c.url === "/posts/any")).toBe(true));
    expect(screen.queryByText("Explore the platform")).not.toBeInTheDocument();
  });

  it("shows the animated member/knife/post stats once real stats are fetched", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    plainMock.onGet("/stats").reply(200, { accountCount: 50, knifeCount: 120, postCount: 30 });
    renderAt("what-is-a-balisong");
    await screen.findByText("Members");
    expect(screen.getByText("Knives")).toBeInTheDocument();
    expect(screen.getByText("Posts")).toBeInTheDocument();
  });
});
