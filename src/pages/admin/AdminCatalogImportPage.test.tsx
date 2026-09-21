import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import AdminCatalogImportPage from "./AdminCatalogImportPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderPage() {
  const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
  setStore(store as any);
  return renderWithProviders(<AdminCatalogImportPage />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("AdminCatalogImportPage — validation", () => {
  it("disables Import until there is text in the textarea", () => {
    renderPage();
    expect(screen.getByText("Import")).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/makers/), { target: { value: "{}" } });
    expect(screen.getByText("Import")).not.toBeDisabled();
  });

  it("shows an error and does not call the API for invalid JSON", async () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/makers/), { target: { value: "not json" } });
    fireEvent.click(screen.getByText("Import"));

    expect(await screen.findByText("That's not valid JSON.")).toBeInTheDocument();
    expect(authMock.history.post.length).toBe(0);
  });
});

describe("AdminCatalogImportPage — submit", () => {
  it("submits the parsed payload and navigates on success", async () => {
    authMock.onPost("/admin/catalog/import").reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ makers: [{ slug: "acme", name: "Acme" }] });
      return [200];
    });
    const { store } = renderPage();

    fireEvent.change(screen.getByPlaceholderText(/makers/), {
      target: { value: '{"makers":[{"slug":"acme","name":"Acme"}]}' },
    });
    fireEvent.click(screen.getByText("Import"));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin/catalog"));
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Catalog import complete." });
  });

  it("shows the server error message and preserves the pasted JSON on failure", async () => {
    authMock.onPost("/admin/catalog/import").reply(500, "Unknown makerSlug: acme");
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/makers/), { target: { value: '{"knives":[{"makerSlug":"acme"}]}' } });
    fireEvent.click(screen.getByText("Import"));

    expect(await screen.findByText("Unknown makerSlug: acme")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('{"knives":[{"makerSlug":"acme"}]}')).toBeInTheDocument();
  });

  it("falls back to a generic error message when the server doesn't return one", async () => {
    authMock.onPost("/admin/catalog/import").reply(500);
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/makers/), { target: { value: "{}" } });
    fireEvent.click(screen.getByText("Import"));

    expect(await screen.findByText("Import failed. Check the console/logs for details.")).toBeInTheDocument();
  });

  it("clears a previous error once a new import succeeds", async () => {
    authMock.onPost("/admin/catalog/import").replyOnce(500, "Bad data").onPost("/admin/catalog/import").reply(200);
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/makers/), { target: { value: "{}" } });
    fireEvent.click(screen.getByText("Import"));
    await screen.findByText("Bad data");

    fireEvent.click(screen.getByText("Import"));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin/catalog"));
    expect(screen.queryByText("Bad data")).not.toBeInTheDocument();
  });
});
