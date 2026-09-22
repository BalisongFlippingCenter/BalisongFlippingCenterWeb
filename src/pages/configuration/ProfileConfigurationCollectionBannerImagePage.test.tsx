import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../../components/accountConfigurationComponents/CollectionBannerConfiguration", () => ({
  default: () => <div data-testid="collection-banner-configuration" />,
}));

import ProfileConfigurationCollectionBannerImagePage from "./ProfileConfigurationCollectionBannerImagePage";

describe("ProfileConfigurationCollectionBannerImagePage", () => {
  it("renders the heading and the CollectionBannerConfiguration form", () => {
    renderWithProviders(<ProfileConfigurationCollectionBannerImagePage />);
    expect(screen.getByRole("heading", { name: "Collection Banner" })).toBeInTheDocument();
    expect(screen.getByTestId("collection-banner-configuration")).toBeInTheDocument();
  });

  it("navigates back when the back button is clicked", () => {
    renderWithProviders(<ProfileConfigurationCollectionBannerImagePage />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
