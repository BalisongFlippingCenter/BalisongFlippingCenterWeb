import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import HomePageCommunitySectionComponent from "./HomePageCommunitySectionComponent";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("HomePageCommunitySectionComponent", () => {
  it("shows Join the Community / Explore Posts for a logged-out visitor", () => {
    renderWithProviders(<HomePageCommunitySectionComponent />);

    fireEvent.click(screen.getByRole("button", { name: "Join the Community" }));
    expect(mockNavigate).toHaveBeenCalledWith("/register");

    fireEvent.click(screen.getByRole("button", { name: "Explore Posts" }));
    expect(mockNavigate).toHaveBeenCalledWith("/community");
  });

  it("shows a single Go to Community button for a logged-in user", () => {
    const store = makeTestStore("tok", makeProfile());
    renderWithProviders(<HomePageCommunitySectionComponent />, store as any);

    expect(screen.queryByRole("button", { name: "Join the Community" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go to Community" }));
    expect(mockNavigate).toHaveBeenCalledWith("/community");
  });
});
