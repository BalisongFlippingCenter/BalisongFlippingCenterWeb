import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { LEARN_TOPICS } from "../data/learnContent";
import LearnPage from "./LearnPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("LearnPage", () => {
  it("renders a card for every learn topic", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    renderWithProviders(<LearnPage />);
    for (const topic of LEARN_TOPICS) {
      expect(screen.getByText(topic.title)).toBeInTheDocument();
    }
    await screen.findByText(LEARN_TOPICS[0].title);
  });

  it("navigates to the topic's detail route when a card is clicked", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    renderWithProviders(<LearnPage />);
    fireEvent.click(screen.getByText(LEARN_TOPICS[0].title));
    expect(mockNavigate).toHaveBeenCalledWith(`/learn/${LEARN_TOPICS[0].slug}`);
    await screen.findByText(LEARN_TOPICS[0].title);
  });

  it("renders community posts in the carousel once fetched", async () => {
    plainMock.onGet("/posts/any").reply(200, {
      content: [{ post: { id: "p1", caption: "Cool flip", creatorDisplayName: "flipperguy" } }],
    });
    renderWithProviders(<LearnPage />);
    expect(await screen.findAllByText("flipperguy")).not.toHaveLength(0);
  });

  it("hides the carousel entirely when there are no community posts", async () => {
    plainMock.onGet("/posts/any").reply(200, { content: [] });
    renderWithProviders(<LearnPage />);
    expect(await screen.findByText("What is a Balisong?")).toBeInTheDocument();
    expect(screen.queryByText("flipperguy")).not.toBeInTheDocument();
  });
});
