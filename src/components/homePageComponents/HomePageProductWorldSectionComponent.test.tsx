import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import HomePageProductWorldSectionComponent from "./HomePageProductWorldSectionComponent";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("HomePageProductWorldSectionComponent", () => {
  it("renders the Knife Pages and Maker Pages feature cards", () => {
    renderWithProviders(<HomePageProductWorldSectionComponent />);
    expect(screen.getByText("Knife Pages")).toBeInTheDocument();
    expect(screen.getByText("Maker Pages")).toBeInTheDocument();
  });

  it("navigates to /product-world when the CTA is clicked", () => {
    renderWithProviders(<HomePageProductWorldSectionComponent />);
    fireEvent.click(screen.getByRole("button", { name: "Explore Product World" }));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world");
  });
});
