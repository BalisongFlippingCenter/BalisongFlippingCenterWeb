import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../api/axios";
import VerificationTokenInput from "./VerificationTokenInput";

vi.mock("./SuccessfulEmailVerificationComponent", () => ({
  default: () => <div data-testid="success-stub" />,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function renderVerification(email = "user@example.com") {
  return render(
    <MemoryRouter initialEntries={[`/register/verify/${email}`]}>
      <Routes>
        <Route path="/register/verify/:verifiedEmail" element={<VerificationTokenInput />} />
      </Routes>
    </MemoryRouter>,
  );
}

function digitInputs() {
  return screen.getAllByRole("spinbutton") as HTMLInputElement[];
}

function fillAllDigits(digits = ["1", "2", "3", "4", "5", "6"]) {
  const inputs = digitInputs();
  digits.forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("VerificationTokenInput", () => {
  it("focuses the first digit input on mount", () => {
    renderVerification();
    expect(document.activeElement).toBe(digitInputs()[0]);
  });

  it("auto-advances focus to the next digit as each one is entered", () => {
    renderVerification();
    const inputs = digitInputs();
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(document.activeElement).toBe(inputs[1]);
    fireEvent.change(inputs[1], { target: { value: "2" } });
    expect(document.activeElement).toBe(inputs[2]);
  });

  it("blurs the last digit input once it's filled", () => {
    renderVerification();
    const inputs = digitInputs();
    fillAllDigits();
    expect(document.activeElement).not.toBe(inputs[5]);
  });

  it("starts disabled before any digit is entered", () => {
    renderVerification();
    expect(screen.getByRole("button", { name: "Verify" })).toBeDisabled();
  });

  // Documents existing (buggy) behavior: readiness is checked only over the
  // array's current length, so it goes true after the very first digit
  // rather than waiting for all six — see summary notes.
  it("enables the submit button as soon as the first digit is entered", () => {
    renderVerification();
    fireEvent.change(digitInputs()[0], { target: { value: "1" } });
    expect(screen.getByRole("button", { name: "Verify" })).not.toBeDisabled();
  });

  it("enables the submit button once every slot has been touched", () => {
    renderVerification();
    fillAllDigits();
    expect(screen.getByRole("button", { name: "Verify" })).not.toBeDisabled();
  });

  it("submits the concatenated 6-digit code and shows the success screen", async () => {
    plainMock.onGet("/auth/verify-email-token/123456").reply(200);
    renderVerification();
    fillAllDigits();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByTestId("success-stub");
  });

  it("shows an error message when the token is rejected", async () => {
    plainMock.onGet("/auth/verify-email-token/123456").reply(400);
    renderVerification();
    fillAllDigits();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("Error: Invalid token entered.");
  });

  it("requests a new code for the current email, clears the fields, and clears any error", async () => {
    plainMock.onGet("/auth/verify-email-token/123456").reply(400);
    plainMock.onPost("/auth/resend-email-token/user@example.com").reply(200);
    renderVerification("user@example.com");
    fillAllDigits();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("Error: Invalid token entered.");

    fireEvent.click(screen.getByRole("button", { name: "Send new code." }));

    await waitFor(() => expect(screen.queryByText("Error: Invalid token entered.")).not.toBeInTheDocument());
    digitInputs().forEach((input) => expect(input.value).toBe(""));
  });

  it("navigates back to /login", () => {
    renderVerification();
    fireEvent.click(screen.getByRole("button", { name: "Back to Login" }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
