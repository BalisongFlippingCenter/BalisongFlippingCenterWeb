import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import UserRegistrationForm from "./UserRegistrationForm";

vi.mock("./login/GoogleLoginComponent", () => ({
  default: () => <div data-testid="google-login-stub" />,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function fillCore(email: string, password: string, confirmPassword = password) {
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: email } });
  fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], { target: { value: password } });
  fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], { target: { value: confirmPassword } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  setStore(makeTestStore() as any);
});

describe("UserRegistrationForm validation", () => {
  it("blocks submission and disables the button when the passwords don't match, without calling the API", () => {
    const store = makeTestStore();
    renderWithProviders(<UserRegistrationForm />, store as any);
    fillCore("user@example.com", "Password1!", "Different1!");
    submit();

    expect(store.getState().auth.errorMsg).toBe("*Passwords do not match.*");
    expect(plainMock.history.post.length).toBe(0);
    expect(screen.getByRole("button", { name: "Create Account" })).toBeDisabled();
  });

  it("blocks submission when the display name contains profanity, without calling the API", () => {
    const store = makeTestStore();
    renderWithProviders(<UserRegistrationForm />, store as any);
    fillCore("user@example.com", "Password1!");
    fireEvent.change(screen.getByPlaceholderText("How you'll appear to others"), { target: { value: "shitlord" } });
    submit();

    expect(store.getState().auth.errorMsg).toBe("*Inappropriate display name.*");
    expect(plainMock.history.post.length).toBe(0);
  });

  it("allows an empty display name (it's optional)", async () => {
    plainMock.onPost("/auth/register").reply(200, {});
    renderWithProviders(<UserRegistrationForm />);
    fillCore("user@example.com", "Password1!");
    submit();
    await waitFor(() => expect(plainMock.history.post.length).toBe(1));
  });

  it("re-enables the submit button and clears the error once a field is edited again", () => {
    const store = makeTestStore();
    renderWithProviders(<UserRegistrationForm />, store as any);
    fillCore("user@example.com", "Password1!", "Different1!");
    submit();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeDisabled();

    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], { target: { value: "Password2!" } });
    expect(screen.getByRole("button", { name: "Create Account" })).not.toBeDisabled();
    expect(store.getState().auth.error).toBe(false);
  });

  it("shows live password-strength feedback as the user types", () => {
    renderWithProviders(<UserRegistrationForm />);
    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    fireEvent.focus(passwordInput);
    fireEvent.change(passwordInput, { target: { value: "Str0ng!!" } });

    expect(screen.getByText("At least 7 characters")).toHaveClass("text-green");
    expect(screen.getByText("One capital letter")).toHaveClass("text-green");
    expect(screen.getByText("One special character")).toHaveClass("text-green");
  });

  it("marks password requirements unmet for a weak password", () => {
    renderWithProviders(<UserRegistrationForm />);
    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    fireEvent.focus(passwordInput);
    fireEvent.change(passwordInput, { target: { value: "weak" } });

    expect(screen.getByText("At least 7 characters")).not.toHaveClass("text-green");
    expect(screen.getByText("One capital letter")).not.toHaveClass("text-green");
    expect(screen.getByText("One special character")).not.toHaveClass("text-green");
  });
});

describe("UserRegistrationForm submission", () => {
  it("routes to the email-verification page on a normal successful registration", async () => {
    plainMock.onPost("/auth/register").reply(200, {});
    renderWithProviders(<UserRegistrationForm />);
    fillCore("user@example.com", "Password1!");
    submit();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/register/verify/user@example.com"));
  });

  it("shows the admin verification-code step instead of navigating for the reserved admin email", async () => {
    plainMock.onPost("/auth/register").reply(200, { requiresAdminVerification: true, email: "admin@example.com" });
    renderWithProviders(<UserRegistrationForm />);
    fillCore("admin@example.com", "Password1!");
    submit();

    await screen.findByText("Verify it's you");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows the generic error banner for an unrecognized server error", async () => {
    plainMock.onPost("/auth/register").reply(500, "Something unexpected happened.");
    renderWithProviders(<UserRegistrationForm />);
    fillCore("user@example.com", "Password1!");
    submit();

    await screen.findByText("Something unexpected happened.");
  });

  it("suppresses the generic banner for a known error (shown inline near its field instead)", async () => {
    const store = makeTestStore();
    plainMock.onPost("/auth/register").reply(409, "Email already exists.");
    renderWithProviders(<UserRegistrationForm />, store as any);
    fillCore("user@example.com", "Password1!");
    submit();

    await waitFor(() => expect(store.getState().auth.errorMsg).toBe("Email already exists."));
    // The generic bottom banner only renders errMsg text when it's NOT a known error.
    const genericBanner = document.querySelector(".absolute.inset-0.text-red");
    expect(genericBanner?.textContent).toBe("");
  });
});

describe("UserRegistrationForm admin verification step", () => {
  it("completes verification, sets the collection, and navigates to /community", async () => {
    plainMock.onPost("/auth/register").reply(200, { requiresAdminVerification: true, email: "admin@example.com" });
    plainMock.onPost("/auth/verify-admin-login").reply(200, {
      accessToken: "tok-admin",
      account: { accountId: "1" },
      collection: { collectedKnives: [] },
    });
    const store = makeTestStore();
    renderWithProviders(<UserRegistrationForm />, store as any);
    fillCore("admin@example.com", "Password1!");
    submit();
    await screen.findByText("Verify it's you");

    fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/community"));
    expect(store.getState().collection.collection).not.toBeNull();
  });

  it("shows an error and stays on the code step when verification fails", async () => {
    plainMock.onPost("/auth/register").reply(200, { requiresAdminVerification: true, email: "admin@example.com" });
    plainMock.onPost("/auth/verify-admin-login").reply(400, "Invalid or expired code.");
    renderWithProviders(<UserRegistrationForm />);
    fillCore("admin@example.com", "Password1!");
    submit();
    await screen.findByText("Verify it's you");

    fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await screen.findByText("Invalid or expired code.");
  });

  it("returns to the registration form via Back", async () => {
    plainMock.onPost("/auth/register").reply(200, { requiresAdminVerification: true, email: "admin@example.com" });
    renderWithProviders(<UserRegistrationForm />);
    fillCore("admin@example.com", "Password1!");
    submit();
    await screen.findByText("Verify it's you");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Create an account")).toBeInTheDocument();
  });
});
