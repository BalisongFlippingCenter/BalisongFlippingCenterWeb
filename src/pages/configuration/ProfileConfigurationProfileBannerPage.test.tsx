import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../../components/accountConfigurationComponents/BannerConfiguration", () => ({
  default: () => <div data-testid="banner-configuration" />,
}));

import ProfileConfigurationProfileBannerPage from "./ProfileConfigurationProfileBannerPage";

describe("ProfileConfigurationProfileBannerPage", () => {
  it("renders the heading and the BannerConfiguration form", () => {
    renderWithProviders(<ProfileConfigurationProfileBannerPage />);
    expect(screen.getByRole("heading", { name: "Profile Banner" })).toBeInTheDocument();
    expect(screen.getByTestId("banner-configuration")).toBeInTheDocument();
  });

  it("navigates back when the back button is clicked", () => {
    renderWithProviders(<ProfileConfigurationProfileBannerPage />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
