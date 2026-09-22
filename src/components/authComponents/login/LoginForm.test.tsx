import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance, setStore } from "../../../api/axios";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { makeTestStore } from "../../../test/testStore";
import { setToRememberLoginInfo } from "../../../redux/auth/authSlice";
import LoginForm from "./LoginForm";

vi.mock("./GoogleLoginComponent", () => ({
  default: () => <div data-testid="google-login-stub" />,
}));

const plainMock = new MockAdapter(axiosApiInstance);

async function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}

beforeEach(() => {
  plainMock.reset();
  localStorage.clear();
  setStore(makeTestStore() as any);
});

describe("LoginForm", () => {
  it("does not submit when email or password is blank", async () => {
    renderWithProviders(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(plainMock.history.post.length).toBe(0);
  });

  it("on successful login, establishes the collection, toasts, and routes non-admins to /community", async () => {
    plainMock.onPost("/auth/login").reply(200, {
      accessToken: "tok-1",
      account: { accountId: "1", role: "USER" },
      collection: { collectedKnives: [] },
    });
    const store = makeTestStore();
    renderWithProviders(<LoginForm />, store as any);

    await fillAndSubmit("user@example.com", "password123");

    await waitFor(() => expect(store.getState().auth.accessToken).toBe("tok-1"));
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Welcome back!" });
  });

  it("shows the admin verification-code step instead of logging in directly for admin accounts", async () => {
    plainMock.onPost("/auth/login").reply(202, { requiresAdminVerification: true, email: "admin@example.com" });
    renderWithProviders(<LoginForm />);

    await fillAndSubmit("admin@example.com", "password123");

    await screen.findByText("Verify it's you");
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });

  it("routes a password-related error to the password field", async () => {
    plainMock.onPost("/auth/login").reply(401, "Invalid credentials");
    renderWithProviders(<LoginForm />);

    await fillAndSubmit("user@example.com", "wrongpassword");

    await screen.findByText("Invalid credentials");
  });

  it("routes an unverified-email error to the email field and shows a verify-email link", async () => {
    plainMock.onPost("/auth/login").reply(409, "Please verify your email before logging in.");
    renderWithProviders(<LoginForm />);

    await fillAndSubmit("unverified@example.com", "password123");

    await screen.findByText("Please verify your email before logging in.");
    expect(screen.getByRole("button", { name: "Verify email" })).toBeInTheDocument();
  });

  it("routes any other error to the generic top-level error banner", async () => {
    plainMock.onPost("/auth/login").reply(500, "Something went wrong");
    renderWithProviders(<LoginForm />);

    await fillAndSubmit("user@example.com", "password123");

    await screen.findByText("Something went wrong");
  });

  it("clears field errors as soon as the user edits email or password again", async () => {
    plainMock.onPost("/auth/login").reply(401, "Invalid credentials");
    renderWithProviders(<LoginForm />);

    await fillAndSubmit("user@example.com", "wrongpassword");
    await screen.findByText("Invalid credentials");

    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "newpassword" } });
    expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
  });

  it("verifies the admin code and completes login on success", async () => {
    plainMock.onPost("/auth/login").reply(202, { requiresAdminVerification: true, email: "admin@example.com" });
    plainMock.onPost("/auth/verify-admin-login").reply(200, {
      accessToken: "tok-admin",
      account: { accountId: "1", role: "ADMIN" },
      collection: { collectedKnives: [] },
    });
    const store = makeTestStore();
    renderWithProviders(<LoginForm />, store as any);

    await fillAndSubmit("admin@example.com", "password123");
    await screen.findByText("Verify it's you");

    fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => expect(store.getState().auth.accessToken).toBe("tok-admin"));
  });

  it("shows an error and stays on the code step when verification fails", async () => {
    plainMock.onPost("/auth/login").reply(202, { requiresAdminVerification: true, email: "admin@example.com" });
    plainMock.onPost("/auth/verify-admin-login").reply(400, "Invalid or expired code.");
    renderWithProviders(<LoginForm />);

    await fillAndSubmit("admin@example.com", "password123");
    await screen.findByText("Verify it's you");

    fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await screen.findByText("Invalid or expired code.");
  });

  it("returns to the login form from the admin code step via Back to login", async () => {
    plainMock.onPost("/auth/login").reply(202, { requiresAdminVerification: true, email: "admin@example.com" });
    renderWithProviders(<LoginForm />);

    await fillAndSubmit("admin@example.com", "password123");
    await screen.findByText("Verify it's you");

    fireEvent.click(screen.getByRole("button", { name: "Back to login" }));
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("persists the entered email to localStorage on successful login when remember-me is checked", async () => {
    plainMock.onPost("/auth/login").reply(200, {
      accessToken: "tok-1",
      account: { accountId: "1", role: "USER" },
      collection: { collectedKnives: [] },
    });
    renderWithProviders(<LoginForm />);

    fireEvent.click(screen.getByRole("checkbox"));
    await fillAndSubmit("remember@example.com", "password123");

    await waitFor(() => expect(localStorage.getItem("saved-user-email")).toBe("remember@example.com"));
  });

  it("prefills the email from localStorage when remember-me was already on", () => {
    localStorage.setItem("save-user-info", "true");
    localStorage.setItem("saved-user-email", "returning@example.com");
    const store = makeTestStore();
    store.dispatch(setToRememberLoginInfo());
    renderWithProviders(<LoginForm />, store as any);
    expect((screen.getByPlaceholderText("you@example.com") as HTMLInputElement).value).toBe("returning@example.com");
  });
});
