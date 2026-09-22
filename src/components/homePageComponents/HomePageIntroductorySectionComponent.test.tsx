import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import HomePageIntroductorySectionComponent from "./HomePageIntroductorySectionComponent";

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

describe("HomePageIntroductorySectionComponent", () => {
  it("shows Get Started / Sign In / Learn the Basics for a logged-out visitor", () => {
    plainMock.onGet("/stats").reply(200, {});
    renderWithProviders(<HomePageIntroductorySectionComponent />);

    fireEvent.click(screen.getByRole("button", { name: "Get Started" }));
    expect(mockNavigate).toHaveBeenCalledWith("/register");

    fireEvent.click(screen.getByRole("button", { name: /Already have an account/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");

    fireEvent.click(screen.getByRole("button", { name: /Learn the Basics/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/learn");
  });

  it("shows a single Go to Community button for a logged-in user", () => {
    plainMock.onGet("/stats").reply(200, {});
    const store = makeTestStore("tok", makeProfile());
    renderWithProviders(<HomePageIntroductorySectionComponent />, store as any);

    fireEvent.click(screen.getByRole("button", { name: "Go to Community" }));
    expect(mockNavigate).toHaveBeenCalledWith("/community");
    expect(screen.queryByRole("button", { name: "Get Started" })).not.toBeInTheDocument();
  });

  it("shows the fallback tagline when stats come back empty", async () => {
    plainMock.onGet("/stats").reply(200, { accountCount: 0, knifeCount: 0, postCount: 0 });
    renderWithProviders(<HomePageIntroductorySectionComponent />);
    await waitFor(() => expect(plainMock.history.get.length).toBeGreaterThan(0));
    expect(screen.getByText(/Growing community/)).toBeInTheDocument();
  });

  it("shows the animated stat labels once real stats are fetched", async () => {
    plainMock.onGet("/stats").reply(200, { accountCount: 120, knifeCount: 340, postCount: 89 });
    renderWithProviders(<HomePageIntroductorySectionComponent />);
    await screen.findByText("Members", {}, { timeout: 3000 });
    expect(screen.getByText("Knives")).toBeInTheDocument();
    expect(screen.getByText("Posts")).toBeInTheDocument();
  });
});
