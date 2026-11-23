import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import AdminCatalogPage from "./AdminCatalogPage";

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeMaker(overrides: Partial<any> = {}) {
  return { slug: "acme", name: "Acme Knives", country: "USA", logoUrl: null, ...overrides };
}

function makeKnife(overrides: Partial<any> = {}) {
  return {
    slug: "krake-raken", name: "Krake Raken", makerName: "Acme Knives", makerSlug: "acme",
    coverPhotoUrl: null, hasActiveVersion: true, ...overrides,
  };
}

function renderPage(makers: any[] = [makeMaker()], knives: any[] = [makeKnife()]) {
  const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
  setStore(store as any);
  authMock.onGet("/catalog/any/makers").reply(200, makers);
  authMock.onGet("/catalog/any/knives").reply(200, knives);
  return renderWithProviders(<AdminCatalogPage />, store as any);
}

beforeEach(() => {
  authMock.reset();
});

describe("AdminCatalogPage — loading/listing", () => {
  it("shows loading, then lists makers and knives", async () => {
    renderPage();
    expect(screen.getAllByText("Loading...")).toHaveLength(2);

    await screen.findByText("Acme Knives", { selector: "p" });
    expect(screen.getByText("Krake Raken")).toBeInTheDocument();
    expect(screen.queryByText(/All discontinued/)).not.toBeInTheDocument();
  });

  it("shows empty states when there are no makers/knives", async () => {
    renderPage([], []);
    await screen.findByText("No makers yet.");
    expect(screen.getByText("No knives yet.")).toBeInTheDocument();
  });

  it("shows an error toast when the fetch fails", async () => {
    authMock.reset();
    authMock.onGet("/catalog/any/makers").reply(500);
    authMock.onGet("/catalog/any/knives").reply(200, []);
    const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
    setStore(store as any);
    renderWithProviders(<AdminCatalogPage />, store as any);

    await waitFor(() => expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Failed to load catalog." }));
  });

  it("flags a knife with no active version as all-discontinued", async () => {
    renderPage([], [makeKnife({ hasActiveVersion: false })]);
    await screen.findByText(/All discontinued/);
  });
});

describe("AdminCatalogPage — grouping", () => {
  const groupedKnives = () => [
    makeKnife({ slug: "squiddy-b", name: "Squiddy-B", makerName: "Squid Industries", makerSlug: "squid", family: "Squiddy" }),
    makeKnife({ slug: "hydro", name: "Hydro", makerName: "Squid Industries", makerSlug: "squid", family: null }),
    makeKnife({ slug: "squiddy", name: "Squiddy", makerName: "Squid Industries", makerSlug: "squid", family: "Squiddy" }),
    makeKnife({ slug: "alpha-beast", name: "Alpha Beast", makerName: "BRS", makerSlug: "brs", family: null }),
  ];

  it("groups knives under collapsible maker headers with family subgroups", async () => {
    renderPage([], groupedKnives());
    const squid = await screen.findByRole("button", { name: /Squid Industries/ });
    const brs = screen.getByRole("button", { name: /BRS/ });

    expect(squid).toHaveTextContent("· 3");
    expect(brs.compareDocumentPosition(squid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const familyHeader = screen.getByText(/^Squiddy/, { selector: "p.uppercase" });
    expect(familyHeader).toHaveTextContent("· 2");
    const familyGroup = familyHeader.parentElement!;
    const familyNames = [...familyGroup.querySelectorAll("a p:first-child")].map((p) => p.textContent);
    expect(familyNames).toEqual(["Squiddy", "Squiddy-B"]);
    expect(familyGroup).not.toContainElement(screen.getByText("Hydro"));

    fireEvent.click(squid);
    expect(squid).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Hydro")).not.toBeInTheDocument();
    expect(screen.getByText("Alpha Beast")).toBeInTheDocument();
  });

  it("matches a search on the family name and keeps collapsed makers open while searching", async () => {
    renderPage([], groupedKnives());
    fireEvent.click(await screen.findByRole("button", { name: /Squid Industries/ }));

    fireEvent.change(screen.getByPlaceholderText("Search makers or knives..."), { target: { value: "squiddy" } });

    expect(screen.getByText("Squiddy-B")).toBeInTheDocument();
    expect(screen.queryByText("Hydro")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /BRS/ })).not.toBeInTheDocument();
  });
});

describe("AdminCatalogPage — search", () => {
  it("filters makers and knives by the search query independently", async () => {
    renderPage(
      [makeMaker({ slug: "acme", name: "Acme Knives" }), makeMaker({ slug: "other", name: "Other Co" })],
      [makeKnife({ slug: "krake-raken", name: "Krake Raken", makerName: "Acme Knives" })],
    );
    await screen.findByText("Acme Knives", { selector: "p" });

    fireEvent.change(screen.getByPlaceholderText("Search makers or knives..."), { target: { value: "krake" } });

    expect(screen.getByText("No makers match your search.")).toBeInTheDocument();
    expect(screen.getByText("Krake Raken")).toBeInTheDocument();
  });
});

describe("AdminCatalogPage — delete", () => {
  it("deletes a maker and removes it from the list on success", async () => {
    authMock.onDelete("/admin/catalog/makers/acme").reply(200);
    const { store } = renderPage();
    await screen.findByText("Acme Knives", { selector: "p" });

    fireEvent.click(document.querySelector(".fa-trash")!.closest("button")!);

    await waitFor(() => expect(screen.queryByText("Acme Knives", { selector: "p" })).not.toBeInTheDocument());
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Maker deleted." });
  });

  it("shows an error toast and keeps the maker listed when delete fails", async () => {
    authMock.onDelete("/admin/catalog/makers/acme").reply(500, "In use");
    const { store } = renderPage();
    await screen.findByText("Acme Knives", { selector: "p" });

    fireEvent.click(document.querySelector(".fa-trash")!.closest("button")!);

    await waitFor(() => expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "In use" }));
    expect(screen.getByText("Acme Knives", { selector: "p" })).toBeInTheDocument();
  });

  it("deletes a knife and removes it from the list on success", async () => {
    authMock.onDelete("/admin/catalog/knives/krake-raken").reply(200);
    const { store } = renderPage([], [makeKnife()]);
    await screen.findByText("Krake Raken");

    fireEvent.click(document.querySelector(".fa-trash")!.closest("button")!);

    await waitFor(() => expect(screen.queryByText("Krake Raken")).not.toBeInTheDocument());
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Knife deleted." });
  });
});
