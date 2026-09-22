import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import ProfileConfigurationChangeEmailPage from "./ProfileConfigurationChangeEmailPage";

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
  const store = makeTestStore("tok", makeProfile({ email: "old@example.com" }));
  setStore(store as any);
  return renderWithProviders(<ProfileConfigurationChangeEmailPage />, store as any);
}

async function reachConfirmStep(store: ReturnType<typeof makeTestStore>) {
  authMock.onPost("/accounts/me/request-email-change").reply(200);
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "new@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Change Email" }));
  await screen.findByText("Code Verification");
  return store;
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("ProfileConfigurationChangeEmailPage — request step", () => {
  it("disables submission for an invalid email", () => {
    renderPage();
    const button = screen.getByRole("button", { name: "Change Email" });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "not-an-email" } });
    expect(button).toBeDisabled();
  });

  it("disables submission when the new email matches the current email", () => {
    renderPage();
    const button = screen.getByRole("button", { name: "Change Email" });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "old@example.com" } });
    expect(button).toBeDisabled();
  });

  it("enables submission for a valid, different email", () => {
    renderPage();
    const button = screen.getByRole("button", { name: "Change Email" });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "new@example.com" } });
    expect(button).not.toBeDisabled();
  });

  it("advances to the code-verification step on a successful request", async () => {
    const { store } = renderPage();
    await reachConfirmStep(store);
    expect(screen.getByText("old@example.com")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    authMock.onPost("/accounts/me/request-email-change").reply(500, "Server error");
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "new@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Change Email" }));
    await screen.findByText("Server error");
  });
});

describe("ProfileConfigurationChangeEmailPage — confirm step", () => {
  it("updates the user's email in the store and shows the success screen", async () => {
    const { store } = renderPage();
    await reachConfirmStep(store);
    authMock.onPost("/accounts/me/confirm-email-change").reply(200, { email: "new@example.com" });
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await screen.findByText("Email updated");
    expect(store.getState().auth.user?.email).toBe("new@example.com");
  });

  it("falls back to the entered email if the response doesn't include one", async () => {
    const { store } = renderPage();
    await reachConfirmStep(store);
    authMock.onPost("/accounts/me/confirm-email-change").reply(200, {});
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await screen.findByText("Email updated");
    expect(store.getState().auth.user?.email).toBe("new@example.com");
  });

  it("shows an invalid-code error for a 400 response", async () => {
    const { store } = renderPage();
    await reachConfirmStep(store);
    authMock.onPost("/accounts/me/confirm-email-change").reply(400, "Invalid code.");
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("Invalid code.");
  });

  it("shows a conflict-specific error for a 409 response", async () => {
    const { store } = renderPage();
    await reachConfirmStep(store);
    authMock.onPost("/accounts/me/confirm-email-change").reply(409, "ignored body");
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("That email is already in use.");
  });

  it("shows a generic error for any other failure", async () => {
    const { store } = renderPage();
    await reachConfirmStep(store);
    authMock.onPost("/accounts/me/confirm-email-change").reply(500);
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await screen.findByText("Something went wrong. Please try again.");
  });

  it("resends the code and shows a temporary confirmation", async () => {
    const { store } = renderPage();
    await reachConfirmStep(store);
    fireEvent.click(screen.getByRole("button", { name: "Didn't receive a code? Resend" }));
    await screen.findByText("Code resent — check your inbox");
  });

  it("the header back button returns to the request step", async () => {
    const { store } = renderPage();
    await reachConfirmStep(store);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Change Email", { selector: "h1" })).toBeInTheDocument();
  });
});
