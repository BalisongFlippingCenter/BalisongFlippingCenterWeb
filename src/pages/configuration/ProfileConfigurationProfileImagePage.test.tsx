import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../../components/accountConfigurationComponents/ProfileImageConfiguration", () => ({
  default: () => <div data-testid="profile-image-configuration" />,
}));

import ProfileConfigurationProfileImagePage from "./ProfileConfigurationProfileImagePage";

describe("ProfileConfigurationProfileImagePage", () => {
  it("renders the heading and the ProfileImageConfiguration form", () => {
    renderWithProviders(<ProfileConfigurationProfileImagePage />);
    expect(screen.getByRole("heading", { name: "Profile Image" })).toBeInTheDocument();
    expect(screen.getByTestId("profile-image-configuration")).toBeInTheDocument();
  });

  it("navigates to /configure when the back button is clicked", () => {
    renderWithProviders(<ProfileConfigurationProfileImagePage />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith("/configure");
  });
});
