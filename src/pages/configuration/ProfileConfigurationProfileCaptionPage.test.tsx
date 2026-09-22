import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../../components/accountConfigurationComponents/ProfileCaptionConfiguration", () => ({
  default: () => <div data-testid="profile-caption-configuration" />,
}));

import ProfileConfigurationProfileCaptionPage from "./ProfileConfigurationProfileCaptionPage";

describe("ProfileConfigurationProfileCaptionPage", () => {
  it("renders the heading and the ProfileCaptionConfiguration form", () => {
    renderWithProviders(<ProfileConfigurationProfileCaptionPage />);
    expect(screen.getByRole("heading", { name: "Profile Caption" })).toBeInTheDocument();
    expect(screen.getByTestId("profile-caption-configuration")).toBeInTheDocument();
  });

  it("navigates back when the back button is clicked", () => {
    renderWithProviders(<ProfileConfigurationProfileCaptionPage />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
