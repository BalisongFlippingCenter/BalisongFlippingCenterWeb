import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import AdminDashboardPage from "./AdminDashboardPage";

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderPage() {
  const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
  setStore(store as any);
  return renderWithProviders(<AdminDashboardPage />, store as any);
}

beforeEach(() => {
  authMock.reset();
});

describe("AdminDashboardPage", () => {
  it("shows the pending report count once loaded", async () => {
    authMock.onGet("/reports").reply(200, { content: [], totalPages: 1, totalElements: 7, number: 0 });
    renderPage();
    await screen.findByText("7 awaiting review");
  });

  it("requests only pending reports, page 0, size 1", async () => {
    authMock.onGet("/reports").reply((config) => {
      expect(config.params).toEqual({ status: "PENDING", page: 0, size: 1 });
      return [200, { content: [], totalPages: 1, totalElements: 0, number: 0 }];
    });
    renderPage();
    await screen.findByText("0 awaiting review");
  });

  it("shows a dash fallback when the fetch fails", async () => {
    authMock.onGet("/reports").reply(500);
    renderPage();
    await waitFor(() => expect(screen.getByText("—")).toBeInTheDocument());
  });

  it("links to the reports page", async () => {
    authMock.onGet("/reports").reply(200, { content: [], totalPages: 1, totalElements: 3, number: 0 });
    renderPage();
    await screen.findByText("3 awaiting review");
    expect(screen.getByRole("link")).toHaveAttribute("href", "/admin/reports");
  });
});
