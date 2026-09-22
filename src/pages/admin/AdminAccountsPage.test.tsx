import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import AdminAccountsPage from "./AdminAccountsPage";

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeAccount(overrides: Partial<any> = {}) {
  return {
    id: "1",
    email: "user@example.com",
    displayName: "someuser",
    identifierCode: "1234",
    role: "USER",
    accountCreationDate: "2020-01-01T00:00:00Z",
    banned: false,
    banReason: null,
    suspendedUntil: null,
    suspendReason: null,
    mutedUntil: null,
    muteReason: null,
    ...overrides,
  };
}

function renderPage() {
  const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
  setStore(store as any);
  return renderWithProviders(<AdminAccountsPage />, store as any);
}

async function searchAndExpand(account: any) {
  authMock.onGet("/admin/accounts/search").reply(200, [account]);
  fireEvent.change(screen.getByPlaceholderText(/Search by email/), { target: { value: "someuser" } });
  fireEvent.click(screen.getByText("Search"));
  await screen.findByText(`${account.displayName}#${account.identifierCode}`);
  fireEvent.click(screen.getByText(`${account.displayName}#${account.identifierCode}`).closest("button")!);
}

beforeEach(() => {
  authMock.reset();
});

describe("AdminAccountsPage — search", () => {
  it("disables search until a query is entered", () => {
    renderPage();
    expect(screen.getByText("Search")).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Search by email/), { target: { value: "abc" } });
    expect(screen.getByText("Search")).not.toBeDisabled();
  });

  it("searches and renders matching accounts", async () => {
    renderPage();
    await searchAndExpand(makeAccount());
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("shows a no-results message after an empty search", async () => {
    authMock.onGet("/admin/accounts/search").reply(200, []);
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/Search by email/), { target: { value: "nobody" } });
    fireEvent.click(screen.getByText("Search"));
    await screen.findByText("No accounts match that search.");
  });

  it("shows an error toast when the search fails", async () => {
    authMock.onGet("/admin/accounts/search").reply(500);
    const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
    setStore(store as any);
    renderWithProviders(<AdminAccountsPage />, store as any);

    fireEvent.change(screen.getByPlaceholderText(/Search by email/), { target: { value: "abc" } });
    fireEvent.click(screen.getByText("Search"));

    await waitFor(() => expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Search failed." }));
  });
});

describe("AdminAccountsPage — badges", () => {
  it("shows a Banned badge for a banned account", async () => {
    renderPage();
    await searchAndExpand(makeAccount({ banned: true, banReason: "Spam" }));
    expect(screen.getAllByText("Banned").length).toBeGreaterThan(0);
    expect(screen.getByText("Spam")).toBeInTheDocument();
  });

  it("shows a Suspended badge when suspendedUntil is in the future, not when it's in the past", async () => {
    renderPage();
    await searchAndExpand(makeAccount({ suspendedUntil: "2099-01-01T00:00:00Z", suspendReason: "Rule break" }));
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("does not show a Suspended badge once the suspension has expired", async () => {
    renderPage();
    await searchAndExpand(makeAccount({ suspendedUntil: "2000-01-01T00:00:00Z" }));
    expect(screen.queryByText("Suspended")).not.toBeInTheDocument();
  });
});

describe("AdminAccountsPage — ban/unban", () => {
  it("disables Ban until a reason is entered, then bans the account", async () => {
    authMock.onPost("/admin/accounts/1/ban").reply(200, makeAccount({ banned: true, banReason: "TOS violation" }));
    const { store } = renderPage();
    await searchAndExpand(makeAccount());

    expect(screen.getByText("Ban")).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Ban reason"), { target: { value: "TOS violation" } });
    expect(screen.getByText("Ban")).not.toBeDisabled();

    fireEvent.click(screen.getByText("Ban"));

    await waitFor(() => expect(authMock.history.post.length).toBe(1));
    expect(JSON.parse(authMock.history.post[0].data)).toEqual({ reason: "TOS violation" });
    await waitFor(() => expect(screen.getAllByText("Banned").length).toBeGreaterThan(0));
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Account banned." });
  });

  it("unbans a banned account", async () => {
    authMock.onPost("/admin/accounts/1/unban").reply(200, makeAccount({ banned: false }));
    renderPage();
    await searchAndExpand(makeAccount({ banned: true, banReason: "Spam" }));

    fireEvent.click(screen.getByText("Unban"));

    await waitFor(() => expect(screen.queryByText("Banned")).not.toBeInTheDocument());
    expect(screen.getByPlaceholderText("Ban reason")).toBeInTheDocument();
  });

  it("shows an error toast and keeps the account unbanned when the ban request fails", async () => {
    authMock.onPost("/admin/accounts/1/ban").reply(500, "Cannot ban an admin");
    const { store } = renderPage();
    await searchAndExpand(makeAccount());

    fireEvent.change(screen.getByPlaceholderText("Ban reason"), { target: { value: "test" } });
    fireEvent.click(screen.getByText("Ban"));

    await waitFor(() => expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Cannot ban an admin" }));
    expect(screen.queryByText("Banned")).not.toBeInTheDocument();
  });
});

describe("AdminAccountsPage — suspend/mute (DurationAction)", () => {
  it("disables Suspend until both a reason and an until date are set, then suspends with an ISO instant", async () => {
    authMock.onPost("/admin/accounts/1/suspend").reply(200, makeAccount({ suspendedUntil: "2099-01-01T00:00:00Z", suspendReason: "Cooldown" }));
    renderPage();
    await searchAndExpand(makeAccount());

    const suspendButton = screen.getByText("Suspend");
    expect(suspendButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Suspend reason"), { target: { value: "Cooldown" } });
    expect(suspendButton).toBeDisabled();

    const datetimeInputs = document.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(datetimeInputs[0], { target: { value: "2099-01-01T12:00" } });
    expect(suspendButton).not.toBeDisabled();

    fireEvent.click(suspendButton);

    await waitFor(() => expect(authMock.history.post.length).toBe(1));
    const body = JSON.parse(authMock.history.post[0].data);
    expect(body.reason).toBe("Cooldown");
    expect(new Date(body.until).toISOString()).toBe(body.until);
    await waitFor(() => expect(screen.getByText(/Suspend until/)).toBeInTheDocument());
  });

  it("lifts an active suspension", async () => {
    authMock.onPost("/admin/accounts/1/unsuspend").reply(200, makeAccount({ suspendedUntil: null }));
    renderPage();
    await searchAndExpand(makeAccount({ suspendedUntil: "2099-01-01T00:00:00Z", suspendReason: "Cooldown" }));

    fireEvent.click(within(screen.getByText(/Suspend until/).closest("div")!.parentElement!).getByText("Lift"));

    await waitFor(() => expect(screen.queryByText(/Suspend until/)).not.toBeInTheDocument());
  });

  it("mutes an account independently of suspend state", async () => {
    authMock.onPost("/admin/accounts/1/mute").reply(200, makeAccount({ mutedUntil: "2099-01-01T00:00:00Z", muteReason: "Spamming comments" }));
    renderPage();
    await searchAndExpand(makeAccount());

    fireEvent.change(screen.getByPlaceholderText("Mute reason"), { target: { value: "Spamming comments" } });
    const datetimeInputs = document.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(datetimeInputs[1], { target: { value: "2099-01-01T12:00" } });
    fireEvent.click(screen.getByText("Mute"));

    await waitFor(() => expect(screen.getByText("Muted")).toBeInTheDocument());
    expect(screen.getByText(/Mute until/)).toBeInTheDocument();
  });
});
