import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import TutorialCenterGettingStartedPage from "./TutorialCenterGettingStartedPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("TutorialCenterGettingStartedPage", () => {
  it("renders the hero heading", () => {
    renderWithProviders(<TutorialCenterGettingStartedPage />);
    expect(screen.getByRole("heading", { name: "Start Your Balisong Journey" })).toBeInTheDocument();
  });

  it("navigates back to the Tutorial Center", () => {
    renderWithProviders(<TutorialCenterGettingStartedPage />);
    fireEvent.click(screen.getByRole("button", { name: /Tutorial Center/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center");
  });

  it("navigates to the double rollout trick guide", () => {
    renderWithProviders(<TutorialCenterGettingStartedPage />);
    fireEvent.click(screen.getByRole("button", { name: /Full Trick Guide/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/beginner/double-rollout");
  });

  it("navigates to the beginner tricks page", () => {
    renderWithProviders(<TutorialCenterGettingStartedPage />);
    fireEvent.click(screen.getByRole("button", { name: /Go to Beginner Tricks/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/tutorial-center/beginner");
  });
});
