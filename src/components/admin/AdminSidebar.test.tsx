import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../api/axios";
import { makeTestStore, makeProfile } from "../../test/testStore";
import AdminSidebar from "./AdminSidebar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function renderSidebar(path = "/admin", userOverrides = {}) {
  const store = makeTestStore("tok", makeProfile({ displayName: "AdminUser", ...userOverrides }));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<AdminSidebar />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("AdminSidebar — mobile drawer", () => {
  it("shows the logo badge and hamburger, closed by default, on an admin route", () => {
    renderSidebar("/admin/reports");
    expect(screen.getByLabelText("Balisong Flipping Center", { selector: "a" })).toBeInTheDocument();
  });

  it("hides the mobile logo badge on non-admin routes", () => {
    renderSidebar("/community");
    expect(screen.queryByLabelText("Balisong Flipping Center", { selector: "a" })).not.toBeInTheDocument();
  });

  it("opens the drawer via the hamburger and closes it via the backdrop", () => {
    renderSidebar("/community");
    fireEvent.click(screen.getAllByRole("button")[0]);
    const backdrop = document.body.querySelector(".bg-black\\/60");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(document.body.querySelector(".bg-black\\/60")).toBeNull();
  });
});

describe("AdminSidebar — navigation highlighting", () => {
  it("marks the active nav item for the current route", () => {
    renderSidebar("/admin/reports");
    const reportsLink = screen.getByRole("link", { name: /Reports/ });
    expect(reportsLink).toHaveClass("text-blue-primary");
    const accountsLink = screen.getByRole("link", { name: /Accounts/ });
    expect(accountsLink).not.toHaveClass("text-blue-primary");
  });

  it("only marks the Dashboard link active on an exact /admin match", () => {
    renderSidebar("/admin/reports");
    const dashboardLink = screen.getByRole("link", { name: /Dashboard/ });
    expect(dashboardLink).not.toHaveClass("text-blue-primary");
  });
});

describe("AdminSidebar — user info", () => {
  it("shows the signed-in display name", () => {
    renderSidebar("/admin", { displayName: "AdminUser" });
    expect(screen.getByText("Signed in as AdminUser")).toBeInTheDocument();
  });
});

describe("AdminSidebar — logout", () => {
  it("logs out, clears state, toasts, and navigates to /login", async () => {
    plainMock.onPost("/auth/logout").reply(200);
    const store = renderSidebar("/admin");
    fireEvent.click(screen.getByRole("button", { name: /Log out/ }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
    expect(store.getState().auth.accessToken).toBeNull();
    expect(store.getState().collection.collection).toBeNull();
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "You've been signed out." });
  });
});
