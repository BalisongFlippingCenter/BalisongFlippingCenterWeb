import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../components/homePageComponents/HomePageIntroductorySectionComponent", () => ({
  default: () => <div data-testid="intro-section" />,
}));
vi.mock("../components/homePageComponents/HomePageCommunitySectionComponent", () => ({
  default: () => <div data-testid="community-section" />,
}));
vi.mock("../components/homePageComponents/HomePageProductWorldSectionComponent", () => ({
  default: () => <div data-testid="product-world-section" />,
}));
vi.mock("../components/homePageComponents/HomePageTutorialCenterSectionComponent", () => ({
  default: () => <div data-testid="tutorial-center-section" />,
}));

import HomePage from "./HomePage";

describe("HomePage", () => {
  it("composes all four hero/section components", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByTestId("intro-section")).toBeInTheDocument();
    expect(screen.getByTestId("community-section")).toBeInTheDocument();
    expect(screen.getByTestId("product-world-section")).toBeInTheDocument();
    expect(screen.getByTestId("tutorial-center-section")).toBeInTheDocument();
  });

  it("navigates to /learn from the closing CTA", () => {
    renderWithProviders(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Learn the Basics/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/learn");
  });

  it("navigates to /about from the closing CTA", () => {
    renderWithProviders(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /About the Project/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/about");
  });

  it("links out to Discord", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByRole("link", { name: /Join our Discord/ })).toHaveAttribute(
      "href",
      "https://discord.gg/k6JPnkbBC",
    );
  });
});
