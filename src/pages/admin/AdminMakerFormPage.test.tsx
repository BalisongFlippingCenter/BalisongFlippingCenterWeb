import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import AdminMakerFormPage from "./AdminMakerFormPage";

const mockNavigate = vi.fn();
let mockParams: { slug?: string } = {};
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => mockParams };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeMakerData(overrides: Partial<any> = {}) {
  return {
    slug: "acme",
    name: "Acme Knives",
    country: "USA",
    knownFor: "Budget flippers",
    officialSiteUrl: "https://acme.example",
    logoUrl: "https://acme.example/logo.png",
    foundedYear: 2010,
    instagramUrl: "https://instagram.com/acme",
    youtubeUrl: "",
    facebookUrl: "",
    twitterUrl: "",
    ...overrides,
  };
}

function renderPage() {
  const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
  setStore(store as any);
  return renderWithProviders(<AdminMakerFormPage />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
  mockParams = {};
});

describe("AdminMakerFormPage — create mode", () => {
  it("shows an empty form with the slug field enabled", () => {
    renderPage();
    expect(screen.getByText("New Maker")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("squid-industries")).not.toBeDisabled();
    expect(screen.getByPlaceholderText("squid-industries")).toHaveValue("");
  });

  it("disables submit until slug and name are filled", () => {
    renderPage();
    const submit = screen.getByText("Create Maker");
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("squid-industries"), { target: { value: "acme" } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Squid Industries"), { target: { value: "Acme" } });
    expect(submit).not.toBeDisabled();
  });

  it("submits a create request with the form payload and navigates on success", async () => {
    authMock.onPost("/admin/catalog/makers").reply(200);
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("squid-industries"), { target: { value: "acme" } });
    fireEvent.change(screen.getByPlaceholderText("Squid Industries"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByText("Create Maker"));

    await waitFor(() => expect(authMock.history.post.length).toBe(1));
    const body = JSON.parse(authMock.history.post[0].data);
    expect(body).toMatchObject({ slug: "acme", name: "Acme" });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin/catalog"));
  });

  it("shows an error toast and preserves form state when the create fails", async () => {
    authMock.onPost("/admin/catalog/makers").reply(500, "Slug already exists");
    const { store } = renderPage();

    fireEvent.change(screen.getByPlaceholderText("squid-industries"), { target: { value: "acme" } });
    fireEvent.change(screen.getByPlaceholderText("Squid Industries"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByText("Create Maker"));

    await waitFor(() => expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Slug already exists" }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("squid-industries")).toHaveValue("acme");
  });
});

describe("AdminMakerFormPage — edit mode", () => {
  beforeEach(() => {
    mockParams = { slug: "acme" };
  });

  it("shows a loading state, then populates fields from the fetched maker", async () => {
    authMock.onGet("/catalog/any/makers/acme").reply(200, makeMakerData());
    renderPage();
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await screen.findByDisplayValue("Acme Knives");
    expect(screen.getByPlaceholderText("squid-industries")).toBeDisabled();
    expect(screen.getByPlaceholderText("squid-industries")).toHaveValue("acme");
    expect(screen.getByDisplayValue("USA")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2010")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://instagram.com/acme")).toBeInTheDocument();
    expect(screen.getByText("Edit Acme Knives")).toBeInTheDocument();
  });

  it("shows an error toast when the maker fails to load", async () => {
    authMock.onGet("/catalog/any/makers/acme").reply(500);
    const { store } = renderPage();

    await waitFor(() => expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Failed to load maker." }));
    expect(screen.getByText("Edit Maker")).toBeInTheDocument();
  });

  it("submits an update request with the edited payload and navigates on success", async () => {
    authMock.onGet("/catalog/any/makers/acme").reply(200, makeMakerData());
    authMock.onPut("/admin/catalog/makers/acme").reply(200);
    renderPage();

    await screen.findByDisplayValue("Acme Knives");
    fireEvent.change(screen.getByDisplayValue("Acme Knives"), { target: { value: "Acme Knives Co" } });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => expect(authMock.history.put.length).toBe(1));
    const body = JSON.parse(authMock.history.put[0].data);
    expect(body).toMatchObject({ slug: "acme", name: "Acme Knives Co", country: "USA" });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin/catalog"));
  });
});
