import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import ForgotPasswordPage from "./ForgotPasswordPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function otpInputs() {
  return screen.getAllByRole("textbox") as HTMLInputElement[];
}

async function enterEmailAndSend(email = "user@example.com") {
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Send Reset Code" }));
  await screen.findByText("Code Verification");
}

function enterCode(code = "123456") {
  const inputs = otpInputs();
  code.split("").forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("ForgotPasswordPage — email step", () => {
  it("disables Send Reset Code until the email looks valid", () => {
    renderWithProviders(<ForgotPasswordPage />);
    const button = screen.getByRole("button", { name: "Send Reset Code" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "not-an-email" } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@example.com" } });
    expect(button).not.toBeDisabled();
  });

  it("advances to the verify step on a successful send", async () => {
    plainMock.onPost("/auth/forgot-password").reply(200);
    renderWithProviders(<ForgotPasswordPage />);
    await enterEmailAndSend("user@example.com");
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("shows a specific message for an unknown email (404)", async () => {
    plainMock.onPost("/auth/forgot-password").reply(404);
    renderWithProviders(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "nobody@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Code" }));
    await screen.findByText("No account found with that email address.");
  });

  it("shows a generic message for any other failure", async () => {
    plainMock.onPost("/auth/forgot-password").reply(500, "Server exploded");
    renderWithProviders(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Code" }));
    await screen.findByText("Server exploded");
  });

  it("navigates to /login from the back button on the first step", () => {
    renderWithProviders(<ForgotPasswordPage />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});

describe("ForgotPasswordPage — verify step", () => {
  it("disables Verify until all 6 digits are entered", async () => {
    plainMock.onPost("/auth/forgot-password").reply(200);
    renderWithProviders(<ForgotPasswordPage />);
    await enterEmailAndSend();

    const verifyButton = screen.getByRole("button", { name: "Verify" });
    expect(verifyButton).toBeDisabled();
    enterCode("12345");
    expect(verifyButton).toBeDisabled();
    enterCode("123456");
    expect(verifyButton).not.toBeDisabled();
  });

  it("advances to the password step once the code is verified", async () => {
    plainMock.onPost("/auth/forgot-password").reply(200);
    renderWithProviders(<ForgotPasswordPage />);
    await enterEmailAndSend();
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(screen.getByRole("heading", { name: "New Password" })).toBeInTheDocument();
  });

  it("resends the code and shows a temporary confirmation message", async () => {
    plainMock.onPost("/auth/forgot-password").reply(200);
    renderWithProviders(<ForgotPasswordPage />);
    await enterEmailAndSend();
    fireEvent.click(screen.getByRole("button", { name: "Didn't receive a code? Resend" }));
    await screen.findByText("Code resent — check your inbox");
  });

  it("going back from verify returns to the email step and clears the code", async () => {
    plainMock.onPost("/auth/forgot-password").reply(200);
    renderWithProviders(<ForgotPasswordPage />);
    await enterEmailAndSend();
    enterCode("123456");
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Reset your password")).toBeInTheDocument();
  });
});

describe("ForgotPasswordPage — password step", () => {
  async function reachPasswordStep() {
    plainMock.onPost("/auth/forgot-password").reply(200);
    renderWithProviders(<ForgotPasswordPage />);
    await enterEmailAndSend();
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
  }

  it("disables Reset Password until both password rules are satisfied", async () => {
    await reachPasswordStep();
    const [newPw, confirmPw] = screen.getAllByPlaceholderText("••••••••");
    const submit = screen.getByRole("button", { name: /Reset Password/ });
    expect(submit).toBeDisabled();

    fireEvent.change(newPw, { target: { value: "short" } });
    fireEvent.change(confirmPw, { target: { value: "short" } });
    expect(submit).toBeDisabled();

    fireEvent.change(newPw, { target: { value: "longenough" } });
    fireEvent.change(confirmPw, { target: { value: "different" } });
    expect(screen.getByText("Does not match")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    fireEvent.change(confirmPw, { target: { value: "longenough" } });
    expect(screen.getByText("Passwords match")).toBeInTheDocument();
    expect(submit).not.toBeDisabled();
  });

  it("shows the success screen after a successful reset", async () => {
    await reachPasswordStep();
    plainMock.onPost("/auth/confirm-forgot-password").reply(200);
    const [newPw, confirmPw] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPw, { target: { value: "longenough" } });
    fireEvent.change(confirmPw, { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/ }));

    await screen.findByText("Password reset");
  });

  it("on an invalid/expired code (400), returns to the verify step with an error", async () => {
    await reachPasswordStep();
    plainMock.onPost("/auth/confirm-forgot-password").reply(400, "Code expired.");
    const [newPw, confirmPw] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPw, { target: { value: "longenough" } });
    fireEvent.change(confirmPw, { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/ }));

    await screen.findByText("Code expired.");
    expect(screen.getByText("Code Verification")).toBeInTheDocument();
  });

  it("on any other failure, shows a generic error and stays on the password step", async () => {
    await reachPasswordStep();
    plainMock.onPost("/auth/confirm-forgot-password").reply(500);
    const [newPw, confirmPw] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPw, { target: { value: "longenough" } });
    fireEvent.change(confirmPw, { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/ }));

    await screen.findByText("Something went wrong. Please try again.");
    expect(screen.getByRole("heading", { name: "New Password" })).toBeInTheDocument();
  });

  it("clicking Back to Sign In on the success screen navigates to /login", async () => {
    await reachPasswordStep();
    plainMock.onPost("/auth/confirm-forgot-password").reply(200);
    const [newPw, confirmPw] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(newPw, { target: { value: "longenough" } });
    fireEvent.change(confirmPw, { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/ }));
    await screen.findByText("Password reset");

    fireEvent.click(screen.getByRole("button", { name: "Back to Sign In" }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
  });
});
