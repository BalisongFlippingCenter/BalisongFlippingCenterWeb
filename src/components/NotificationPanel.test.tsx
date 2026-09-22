import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore } from "../test/testStore";
import { setNotifications, AppNotification } from "../redux/notifications/notificationSlice";
import NotificationPanel from "./NotificationPanel";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 1,
    type: "POST_LIKED",
    message: "liked your post",
    targetType: "POST",
    targetId: 10,
    actorDisplayName: "someone",
    actorIdentifierCode: "1234",
    actorProfileImg: null,
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPanel(isOpen: boolean, onClose = vi.fn()) {
  const store = makeTestStore("tok");
  setStore(store as any);
  return { onClose, ...renderWithProviders(<NotificationPanel isOpen={isOpen} onClose={onClose} />, store as any) };
}

// Opens the panel with its own fetch pre-mocked to resolve empty, and waits
// for the initial loading spinner to clear before the test injects its own
// notifications — the component's local `loading` state gates the list.
async function renderPanelReady(onClose = vi.fn()) {
  authMock.onGet("/notifications").reply(200, { content: [] });
  authMock.onPatch("/notifications/read-all").reply(200);
  const result = renderPanel(true, onClose);
  await waitFor(() => expect(screen.getAllByText("All caught up").length).toBeGreaterThan(0));
  return result;
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("NotificationPanel — closed state", () => {
  it("renders nothing when isOpen is false", () => {
    renderPanel(false);
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });
});

describe("NotificationPanel — opening", () => {
  it("optimistically marks all read and fetches the full list", async () => {
    authMock.onGet("/notifications").reply(200, { content: [makeNotification()] });
    authMock.onPatch("/notifications/read-all").reply(200);
    const { store } = renderPanel(true);

    expect(store.getState().notifications.unreadCount).toBe(0);
    await waitFor(() => expect(authMock.history.get.length).toBe(1));
    await waitFor(() => expect(authMock.history.patch.length).toBe(1));
    expect(store.getState().notifications.notifications[0].isRead).toBe(true);
  });

  it("shows the empty state once loaded with no notifications", async () => {
    authMock.onGet("/notifications").reply(200, { content: [] });
    authMock.onPatch("/notifications/read-all").reply(200);
    renderPanel(true);
    await waitFor(() => expect(screen.getAllByText("All caught up").length).toBeGreaterThan(0));
  });
});

describe("NotificationPanel — item click", () => {
  it("marks an unread notification read, navigates, and closes", async () => {
    const { store, onClose } = await renderPanelReady();
    authMock.onPatch("/notifications/5/read").reply(200);
    act(() => {
      store.dispatch(setNotifications([makeNotification({ id: 5, type: "POST_LIKED", targetId: 42, isRead: false })]));
    });

    const items = screen.getAllByText("liked your post");
    fireEvent.click(items[0].closest("button")!);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/post/42"));
    expect(onClose).toHaveBeenCalled();
    await waitFor(() => expect(authMock.history.patch.some((r) => r.url === "/notifications/5/read")).toBe(true));
  });

  it("does not PATCH read for an already-read notification, but still navigates", async () => {
    const { store, onClose } = await renderPanelReady();
    act(() => {
      store.dispatch(setNotifications([makeNotification({ id: 5, type: "NEW_FOLLOWER", isRead: true })]));
    });

    const items = screen.getAllByText("started following you");
    fireEvent.click(items[0].closest("button")!);

    expect(mockNavigate).toHaveBeenCalledWith("/someone/1234");
    expect(onClose).toHaveBeenCalled();
    expect(authMock.history.patch.some((r) => r.url === "/notifications/5/read")).toBe(false);
  });

  it("navigates to the comments-focused post for a reply notification", async () => {
    const { store } = await renderPanelReady();
    act(() => {
      store.dispatch(setNotifications([makeNotification({ id: 5, type: "COMMENT_REPLIED", targetId: 99, isRead: true })]));
    });
    fireEvent.click(screen.getAllByText("replied to your comment")[0].closest("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/post/99?focus=comments");
  });
});

describe("NotificationPanel — header badge", () => {
  it("shows the unread count in the header", async () => {
    const { store } = await renderPanelReady();
    act(() => {
      store.dispatch(setNotifications([makeNotification({ isRead: false })]));
    });
    // setNotifications derives unreadCount from payload
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });
});
