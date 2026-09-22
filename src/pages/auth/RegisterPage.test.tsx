import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import RegisterPage from "./RegisterPage";

vi.mock("../../components/authComponents/login/GoogleLoginComponent", () => ({
  default: () => <div data-testid="google-login-stub" />,
}));

describe("RegisterPage", () => {
  it("renders the registration form", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByPlaceholderText("How you'll appear to others")).toBeInTheDocument();
  });
});
