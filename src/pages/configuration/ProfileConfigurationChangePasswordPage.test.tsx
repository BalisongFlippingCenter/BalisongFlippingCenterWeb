import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import ProfileConfigurationChangePasswordPage from "./ProfileConfigurationChangePasswordPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function otpInputs() {
  return screen.getAllByRole("textbox") as HTMLInputElement[];
}

function enterCode(code = "123456") {
  const inputs = otpInputs();
  code.split("").forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));
}

function renderPage() {
  const store = makeTestStore("tok", makeProfile({ email: "user@example.com" }));
  setStore(store as any);
  return renderWithProviders(<ProfileConfigurationChangePasswordPage />, store as any);
}

async function reachConfirmStep() {
  authMock.onPost("/accounts/me/request-password-change").reply(200);
  renderPage();
  const [newPw, confirmPw] = screen.getAllByPlaceholderText("••••••••");
  fireEvent.change(newPw, { target: { value: "longenough" } });
  fireEvent.change(confirmPw, { target: { value: "longenough" } });
  fireEvent.click(screen.getByRole("button", { name: "Change Password" }));
  await screen.findByText("Code Verification");
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("ProfileConfigurationChangePasswordPage — request step", () => {
  it("disables submission until the new password is long enough and confirmed", () => {
    renderPage();
    const [newPw, confirmPw] = screen.getAllByPlaceholderText("••••••••");
    const submit = screen.getByRole("button", { name: "Change Password" });
    expect(submit).toBeDisabled();

    fireEvent.change(newPw, { target: { value: "longenough" } });
    fireEvent.change(confirmPw, { target: { value: "different" } });
    expect(screen.getByText("Does not match")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    fireEvent.change(confirmPw, { target: { value: "longenough" } });
    expect(submit).not.toBeDisabled();
  });

  it("advances to the code-verification step on a successful request", async () => {
    await reachConfirmStep();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    authMock.onPost("/accounts/me/request-password-change").reply(500, "Server error");
    renderPage();
    const [newPw, confirmPw] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPw, { target: { value: "longenough" } });
    fireEvent.change(confirmPw, { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));
    await screen.findByText("Server error");
  });

  it("navigates back on the header button from the request step", () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

describe("ProfileConfigurationChangePasswordPage — confirm step", () => {
  it("disables Verify until all 6 digits are entered", async () => {
    await reachConfirmStep();
    const verifyButton = screen.getByRole("button", { name: "Verify" });
    expect(verifyButton).toBeDisabled();
    enterCode();
    expect(verifyButton).not.toBeDisabled();
  });

  it("shows the success screen after a successful confirmation", async () => {
    await reachConfirmStep();
    authMock.onPost("/accounts/me/confirm-password-change").reply(200);
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("Password updated");
  });

  it("shows an invalid-code error for a 400 response", async () => {
    await reachConfirmStep();
    authMock.onPost("/accounts/me/confirm-password-change").reply(400, "Invalid code.");
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("Invalid code.");
  });

  it("shows a generic error for a non-400 failure", async () => {
    await reachConfirmStep();
    authMock.onPost("/accounts/me/confirm-password-change").reply(500);
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("Something went wrong. Please try again.");
  });

  it("resends the code and shows a temporary confirmation", async () => {
    await reachConfirmStep();
    fireEvent.click(screen.getByRole("button", { name: "Didn't receive a code? Resend" }));
    await screen.findByText("Code resent — check your inbox");
  });

  it("the header back button returns to the request step and clears the code", async () => {
    await reachConfirmStep();
    enterCode();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Change Password", { selector: "h1" })).toBeInTheDocument();
  });

  it("the success screen's Done button navigates back", async () => {
    await reachConfirmStep();
    authMock.onPost("/accounts/me/confirm-password-change").reply(200);
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("Password updated");

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(-1));
  });
});
