import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../../components/accountConfigurationComponents/DisplayNameConfiguration", () => ({
  default: () => <div data-testid="display-name-configuration" />,
}));

import ProfileConfigurationDisplayNamePage from "./ProfileConfigurationDisplayNamePage";

describe("ProfileConfigurationDisplayNamePage", () => {
  it("renders the heading and the DisplayNameConfiguration form", () => {
    renderWithProviders(<ProfileConfigurationDisplayNamePage />);
    expect(screen.getByRole("heading", { name: "Display Name" })).toBeInTheDocument();
    expect(screen.getByTestId("display-name-configuration")).toBeInTheDocument();
  });

  it("navigates back when the back button is clicked", () => {
    renderWithProviders(<ProfileConfigurationDisplayNamePage />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
