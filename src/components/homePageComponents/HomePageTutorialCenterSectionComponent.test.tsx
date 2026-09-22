import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import HomePageTutorialCenterSectionComponent from "./HomePageTutorialCenterSectionComponent";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("HomePageTutorialCenterSectionComponent", () => {
  it("renders the feature cards", () => {
    renderWithProviders(<HomePageTutorialCenterSectionComponent />);
    expect(screen.getByText("Trick Library")).toBeInTheDocument();
    expect(screen.getByText("Community Clips")).toBeInTheDocument();
    expect(screen.getByText("Learn by Level")).toBeInTheDocument();
  });

  it("navigates to /tutorial-center when the CTA is clicked", () => {
    renderWithProviders(<HomePageTutorialCenterSectionComponent />);
    fireEvent.click(screen.getByRole("button", { name: "Explore Tutorial Center" }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center");
  });
});
