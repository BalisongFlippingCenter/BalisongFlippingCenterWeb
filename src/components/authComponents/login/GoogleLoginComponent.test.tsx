import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../../api/axios";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { makeTestStore } from "../../../test/testStore";
import GoogleLoginComponent from "./GoogleLoginComponent";

let capturedOptions: { onSuccess: (res: { access_token: string }) => void; onError: () => void };
const triggerLogin = vi.fn();

vi.mock("@react-oauth/google", () => ({
  useGoogleLogin: (opts: any) => {
    capturedOptions = opts;
    return triggerLogin;
  },
}));

const plainMock = new MockAdapter(axiosApiInstance);

beforeEach(() => {
  plainMock.reset();
  triggerLogin.mockReset();
});

describe("GoogleLoginComponent", () => {
  it("renders the provided label and triggers the OAuth flow on click", () => {
    renderWithProviders(<GoogleLoginComponent label="Sign in with Google" />);
    fireEvent.click(screen.getByRole("button", { name: /Sign in with Google/i }));
    expect(triggerLogin).toHaveBeenCalled();
  });

  it("on success, establishes the collection and navigates existing users to /community", async () => {
    plainMock.onPost("/auth/google").reply(200, {
      accessToken: "tok-1",
      account: { accountId: "1" },
      collection: { collectedKnives: [] },
      isNewUser: false,
    });
    const store = makeTestStore();
    renderWithProviders(<GoogleLoginComponent />, store as any);

    await act(async () => {
      capturedOptions.onSuccess({ access_token: "google-tok" });
    });

    await waitFor(() => expect(store.getState().collection.collection).not.toBeNull());
  });

  it("shows an error message when the backend rejects the Google token", async () => {
    plainMock.onPost("/auth/google").reply(400, "Google login failed");
    renderWithProviders(<GoogleLoginComponent />);

    await act(async () => {
      capturedOptions.onSuccess({ access_token: "google-tok" });
    });

    await screen.findByText("Google login failed");
  });

  it("shows a generic error message when the popup itself fails", async () => {
    renderWithProviders(<GoogleLoginComponent />);
    act(() => {
      capturedOptions.onError();
    });
    await screen.findByText("Google sign-in was cancelled or failed.");
  });

  it("renders icon-only mode without a visible label", () => {
    renderWithProviders(<GoogleLoginComponent iconOnly />);
    expect(screen.queryByText("Sign in with Google")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
