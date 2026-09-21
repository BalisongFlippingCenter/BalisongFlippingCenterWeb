import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import LinkConfiguration from "./LinkConfiguration";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderLink(linkType: string, userOverrides = {}) {
  const store = makeTestStore("tok", makeProfile(userOverrides));
  setStore(store as any);
  return renderWithProviders(<LinkConfiguration linkType={linkType as any} />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe.each([
  { type: "facebook", valid: "https://www.facebook.com/me", invalid: "https://twitter.com/me" },
  { type: "instagram", valid: "https://www.instagram.com/me", invalid: "https://twitter.com/me" },
  { type: "youtube", valid: "https://www.youtube.com/@me", invalid: "https://twitter.com/me" },
  { type: "reddit", valid: "https://www.reddit.com/u/me", invalid: "https://twitter.com/me" },
  { type: "twitter", valid: "https://x.com/me", invalid: "notaurl" },
  { type: "website", valid: "https://mysite.com", invalid: "mysite.com" },
])("LinkConfiguration — $type prefix validation", ({ type, valid, invalid }) => {
  it("rejects a value that doesn't match the required prefix", () => {
    renderLink(type);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: invalid } });
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));
    expect(authMock.history.post.length).toBe(0);
  });

  it("accepts a value with the correct prefix and submits it", async () => {
    authMock.onPost("accounts/me/update-social-links").reply(200);
    renderLink(type);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: valid } });
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });
});

describe("LinkConfiguration — discord (no prefix requirement)", () => {
  it("accepts any non-empty value", async () => {
    authMock.onPost("accounts/me/update-social-links").reply(200);
    renderLink("discord");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "my_username" } });
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });
});

describe("LinkConfiguration — shared behavior", () => {
  it("prefills the input from the user's existing value for that link type", () => {
    renderLink("website", { personalWebsiteLink: "https://existing.com" });
    expect(screen.getByRole("textbox")).toHaveValue("https://existing.com");
    expect(screen.getByText("https://existing.com")).toBeInTheDocument();
  });

  it("shows 'Not set' when there is no existing value", () => {
    renderLink("website");
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("disables Save while the value is unchanged from the current one", () => {
    renderLink("website", { personalWebsiteLink: "https://existing.com" });
    const submit = screen.getByRole("button", { name: /Save/ });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://different.com" } });
    expect(submit).not.toBeDisabled();
  });

  it("on success, updates the store, toasts, and navigates back", async () => {
    authMock.onPost("accounts/me/update-social-links").reply(200);
    const { store } = renderLink("website");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://mysite.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));

    await waitFor(() => expect(store.getState().auth.user?.personalWebsiteLink).toBe("https://mysite.com"));
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Personal Website link updated!" });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("on failure, shows an error and toasts an error without navigating", async () => {
    authMock.onPost("accounts/me/update-social-links").reply(500);
    const { store } = renderLink("website");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://mysite.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));

    await screen.findByText("Something went wrong. Please try again.");
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error" });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("hides the Remove button when no value is currently set", () => {
    renderLink("website");
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("shows the Remove button when a value is currently set", () => {
    renderLink("website", { personalWebsiteLink: "https://existing.com" });
    expect(screen.getByRole("button", { name: /Remove/ })).toBeInTheDocument();
  });

  it("removing clears the field in the store, toasts, and navigates back", async () => {
    authMock.onPost("accounts/me/update-social-links").reply(200);
    const { store } = renderLink("website", { personalWebsiteLink: "https://existing.com" });
    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));

    await waitFor(() => expect(store.getState().auth.user?.personalWebsiteLink).toBeNull());
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Personal Website link removed." });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
