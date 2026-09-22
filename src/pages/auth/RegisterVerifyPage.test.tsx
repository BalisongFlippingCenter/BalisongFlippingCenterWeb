import { describe, it, expect, vi } from "vitest";
import { screen, render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RegisterVerifyPage from "./RegisterVerifyPage";

vi.mock("../../components/authComponents/SuccessfulEmailVerificationComponent", () => ({
  default: () => <div data-testid="success-stub" />,
}));

describe("RegisterVerifyPage", () => {
  it("renders the six-digit verification code input", () => {
    render(
      <MemoryRouter initialEntries={["/register/verify/user@example.com"]}>
        <Routes>
          <Route path="/register/verify/:verifiedEmail" element={<RegisterVerifyPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("spinbutton")).toHaveLength(6);
  });
});
