import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import AdminReportsPage from "./AdminReportsPage";

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeReport(overrides: Partial<any> = {}) {
  return {
    id: 1,
    targetType: "POST",
    targetId: 42,
    reason: "SPAM",
    additionalNote: null,
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00Z",
    reviewedAt: null,
    reviewedByAccountId: null,
    ...overrides,
  };
}

function renderPage() {
  const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
  setStore(store as any);
  return renderWithProviders(<AdminReportsPage />, store as any);
}

beforeEach(() => {
  authMock.reset();
});

describe("AdminReportsPage — initial load", () => {
  it("shows a loading state then the list of reports", async () => {
    authMock.onGet("/reports").reply(200, {
      content: [makeReport({ id: 1 }), makeReport({ id: 2, targetType: "COMMENT", targetId: 9 })],
      totalPages: 1,
      totalElements: 2,
      number: 0,
    });
    renderPage();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await screen.findByText("Post #42");
    expect(screen.getByText("Comment #9")).toBeInTheDocument();
  });

  it("defaults the status filter to PENDING on first fetch", async () => {
    authMock.onGet("/reports").reply((config) => {
      expect(config.params).toMatchObject({ status: "PENDING", page: 0, size: 20 });
      return [200, { content: [], totalPages: 0, totalElements: 0, number: 0 }];
    });
    renderPage();
    await screen.findByText("No reports match these filters.");
  });

  it("shows the empty state when there are no matching reports", async () => {
    authMock.onGet("/reports").reply(200, { content: [], totalPages: 0, totalElements: 0, number: 0 });
    renderPage();
    await screen.findByText("No reports match these filters.");
  });

  it("shows an error toast when the fetch fails", async () => {
    authMock.onGet("/reports").reply(500);
    const { store } = renderPage();
    await waitFor(() =>
      expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Failed to load reports." }),
    );
  });
});

describe("AdminReportsPage — filters", () => {
  it("refetches with the selected status filter", async () => {
    authMock.onGet("/reports").reply(200, { content: [], totalPages: 0, totalElements: 0, number: 0 });
    renderPage();
    await screen.findByText("No reports match these filters.");

    authMock.reset();
    authMock.onGet("/reports").reply((config) => {
      expect(config.params).toMatchObject({ status: "DISMISSED" });
      return [200, { content: [], totalPages: 0, totalElements: 0, number: 0 }];
    });
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "DISMISSED" } });
    await waitFor(() => expect(authMock.history.get.length).toBeGreaterThan(0));
  });

  it("refetches with the selected target-type filter", async () => {
    authMock.onGet("/reports").reply(200, { content: [], totalPages: 0, totalElements: 0, number: 0 });
    renderPage();
    await screen.findByText("No reports match these filters.");

    authMock.reset();
    authMock.onGet("/reports").reply((config) => {
      expect(config.params).toMatchObject({ targetType: "MESSAGE" });
      return [200, { content: [], totalPages: 0, totalElements: 0, number: 0 }];
    });
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "MESSAGE" } });
    await waitFor(() => expect(authMock.history.get.length).toBeGreaterThan(0));
  });
});

describe("AdminReportsPage — updating status", () => {
  it("marks a report with a new status and shows a success toast", async () => {
    authMock.onGet("/reports").reply(200, {
      content: [makeReport({ id: 5, status: "PENDING" })],
      totalPages: 1,
      totalElements: 1,
      number: 0,
    });
    authMock.onPatch("/reports/5/status").reply(200, makeReport({ id: 5, status: "DISMISSED" }));
    const { store } = renderPage();
    await screen.findByText("Post #42");

    fireEvent.click(screen.getByRole("button", { name: "Mark Dismissed" }));

    await waitFor(() => expect(screen.getByText("Dismissed")).toBeInTheDocument());
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Report marked Dismissed." });
    expect(JSON.parse(authMock.history.patch[0].data)).toEqual({ status: "DISMISSED" });
  });

  it("shows an error toast when the status update fails", async () => {
    authMock.onGet("/reports").reply(200, {
      content: [makeReport({ id: 5 })],
      totalPages: 1,
      totalElements: 1,
      number: 0,
    });
    authMock.onPatch("/reports/5/status").reply(500);
    const { store } = renderPage();
    await screen.findByText("Post #42");

    fireEvent.click(screen.getByRole("button", { name: "Mark Actioned" }));

    await waitFor(() =>
      expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Failed to update report status." }),
    );
  });

  it("only shows status buttons for statuses other than the report's current one", async () => {
    authMock.onGet("/reports").reply(200, {
      content: [makeReport({ id: 5, status: "REVIEWED" })],
      totalPages: 1,
      totalElements: 1,
      number: 0,
    });
    renderPage();
    await screen.findByText("Post #42");
    expect(screen.queryByRole("button", { name: "Mark Reviewed" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Pending" })).toBeInTheDocument();
  });
});

describe("AdminReportsPage — view link", () => {
  it("shows a View link for POST reports pointing at the post", async () => {
    authMock.onGet("/reports").reply(200, {
      content: [makeReport({ id: 1, targetType: "POST", targetId: 42 })],
      totalPages: 1,
      totalElements: 1,
      number: 0,
    });
    renderPage();
    await screen.findByText("Post #42");
    expect(screen.getByRole("link", { name: /View/ })).toHaveAttribute("href", "/post/42");
  });

  it("hides the View link for non-POST reports", async () => {
    authMock.onGet("/reports").reply(200, {
      content: [makeReport({ id: 1, targetType: "PROFILE", targetId: 7 })],
      totalPages: 1,
      totalElements: 1,
      number: 0,
    });
    renderPage();
    await screen.findByText("Profile #7");
    expect(screen.queryByRole("link", { name: /View/ })).not.toBeInTheDocument();
  });
});

describe("AdminReportsPage — pagination", () => {
  it("hides pagination controls when there is only one page", async () => {
    authMock.onGet("/reports").reply(200, { content: [], totalPages: 1, totalElements: 0, number: 0 });
    renderPage();
    await screen.findByText("No reports match these filters.");
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });

  it("shows and navigates pagination controls when there are multiple pages", async () => {
    authMock.onGet("/reports").reply((config) => {
      const page = config.params.page ?? 0;
      return [200, { content: [], totalPages: 2, totalElements: 0, number: page }];
    });
    renderPage();
    await screen.findByText("Page 1 of 2");

    const [prevBtn, nextBtn] = screen.getAllByRole("button");
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    await waitFor(() => expect(screen.getByText("Page 2 of 2")).toBeInTheDocument());
    expect(screen.getAllByRole("button")[1]).toBeDisabled();
  });
});
