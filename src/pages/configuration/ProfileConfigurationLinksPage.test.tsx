import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../../components/accountConfigurationComponents/LinkConfiguration", () => ({
  default: ({ linkType }: { linkType: string }) => <div data-testid="link-configuration">{linkType}</div>,
}));

import ProfileConfigurationLinksPage from "./ProfileConfigurationLinksPage";

describe("ProfileConfigurationLinksPage", () => {
  it("shows an unknown-link-type message for an invalid linkType", () => {
    renderWithProviders(<ProfileConfigurationLinksPage linkType="myspace" />);
    expect(screen.getByText("Unknown link type.")).toBeInTheDocument();
  });

  it("renders the mapped title and passes linkType through for a known type", () => {
    renderWithProviders(<ProfileConfigurationLinksPage linkType="youtube" />);
    expect(screen.getByRole("heading", { name: "YouTube" })).toBeInTheDocument();
    expect(screen.getByTestId("link-configuration")).toHaveTextContent("youtube");
  });

  it("navigates back when the back button is clicked", () => {
    renderWithProviders(<ProfileConfigurationLinksPage linkType="discord" />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
