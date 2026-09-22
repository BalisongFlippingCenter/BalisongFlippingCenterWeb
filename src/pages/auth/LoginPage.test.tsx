import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { LoginPage } from "./LoginPage";

vi.mock("../../components/authComponents/login/GoogleLoginComponent", () => ({
  default: () => <div data-testid="google-login-stub" />,
}));

describe("LoginPage", () => {
  it("renders the login form", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });
});
