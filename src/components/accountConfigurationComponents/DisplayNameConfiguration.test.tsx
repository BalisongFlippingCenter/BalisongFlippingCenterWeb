import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import DisplayNameConfiguration from "./DisplayNameConfiguration";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderPage() {
  const store = makeTestStore("tok", makeProfile({ displayName: "OldName", identifierCode: "1111" }));
  setStore(store as any);
  return renderWithProviders(<DisplayNameConfiguration />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("DisplayNameConfiguration", () => {
  it("disables submission when the name is unchanged", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Save Display Name" })).toBeDisabled();
  });

  it("disables submission and shows a length error for names shorter than 4 characters", () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Enter display name"), { target: { value: "Abc" } });
    const submit = screen.getByRole("button", { name: "Save Display Name" });
    expect(submit).toBeDisabled();

    // The button is disabled in the UI, but the handler's own guard is worth
    // pinning directly too — submit the form programmatically to exercise it.
    fireEvent.submit(submit.closest("form")!);
    expect(screen.getByText("Display name must be at least 4 characters long.")).toBeInTheDocument();
  });

  it("enables submission for a valid, changed name", () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Enter display name"), { target: { value: "NewName" } });
    expect(screen.getByRole("button", { name: "Save Display Name" })).not.toBeDisabled();
  });

  it("on success (object response), updates the store and navigates to the new profile URL", async () => {
    authMock.onPost("/accounts/me/change-display-name").reply(200, { displayName: "NewName", identifierCode: "2222" });
    const { store } = renderPage();
    fireEvent.change(screen.getByPlaceholderText("Enter display name"), { target: { value: "NewName" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Display Name" }));

    await waitFor(() => expect(store.getState().auth.user?.displayName).toBe("NewName"));
    expect(store.getState().auth.user?.identifierCode).toBe("2222");
    expect(mockNavigate).toHaveBeenCalledWith("/NewName/2222", { replace: true });
  });

  it("on success (plain-string response), keeps the existing identifier code", async () => {
    authMock.onPost("/accounts/me/change-display-name").reply(200, "NewName");
    const { store } = renderPage();
    fireEvent.change(screen.getByPlaceholderText("Enter display name"), { target: { value: "NewName" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Display Name" }));

    await waitFor(() => expect(store.getState().auth.user?.displayName).toBe("NewName"));
    expect(store.getState().auth.user?.identifierCode).toBe("1111");
    expect(mockNavigate).toHaveBeenCalledWith("/NewName/1111", { replace: true });
  });

  it("shows an error message on failure", async () => {
    authMock.onPost("/accounts/me/change-display-name").reply(409, { message: "Name already taken." });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Enter display name"), { target: { value: "NewName" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Display Name" }));
    await screen.findByText("Name already taken.");
  });

  it("logs the user out and clears the collection on a 401 response", async () => {
    authMock.onPost("/accounts/me/change-display-name").reply(401, {});
    authMock.onPost("/auth/logout").reply(200);
    const { store } = renderPage();
    fireEvent.change(screen.getByPlaceholderText("Enter display name"), { target: { value: "NewName" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Display Name" }));

    await waitFor(() => expect(store.getState().auth.accessToken).toBeNull());
    expect(store.getState().collection.collection).toBeNull();
  });

  it("shows a live preview of the new handle while typing a valid, changed name", () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Enter display name"), { target: { value: "NewName" } });
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("NewName")).toBeInTheDocument();
  });
});
