import { describe, it, expect } from "vitest";
import reducer, {
  setNotifications,
  addNotification,
  setUnreadCount,
  markAllRead,
  markOneRead,
  removeToast,
  clearNotifications,
  AppNotification,
} from "./notificationSlice";

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
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("notificationSlice", () => {
  it("starts empty", () => {
    const state = reducer(undefined, { type: "@@INIT" });
    expect(state).toEqual({ notifications: [], unreadCount: 0, toasts: [] });
  });

  it("setNotifications derives unreadCount from the payload", () => {
    const state = reducer(
      undefined,
      setNotifications([makeNotification({ id: 1, isRead: false }), makeNotification({ id: 2, isRead: true })]),
    );
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
  });

  it("addNotification prepends, increments unreadCount, and queues a toast for non-message types", () => {
    const state = reducer(undefined, addNotification(makeNotification({ id: 5, isRead: false })));
    expect(state.notifications[0].id).toBe(5);
    expect(state.unreadCount).toBe(1);
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].notification.id).toBe(5);
  });

  it("addNotification does not increment unreadCount for an already-read notification", () => {
    const state = reducer(undefined, addNotification(makeNotification({ isRead: true })));
    expect(state.unreadCount).toBe(0);
  });

  it("addNotification excludes MESSAGE_RECEIVED from unreadCount and toasts", () => {
    const state = reducer(
      undefined,
      addNotification(makeNotification({ type: "MESSAGE_RECEIVED", isRead: false })),
    );
    expect(state.notifications).toHaveLength(1);
    expect(state.unreadCount).toBe(0);
    expect(state.toasts).toHaveLength(0);
  });

  it("setUnreadCount overwrites the count directly", () => {
    const state = reducer(undefined, setUnreadCount(42));
    expect(state.unreadCount).toBe(42);
  });

  it("markAllRead marks every notification read and zeroes the count", () => {
    let state = reducer(undefined, setNotifications([makeNotification({ id: 1 }), makeNotification({ id: 2 })]));
    state = reducer(state, markAllRead());
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("markOneRead marks a single notification read and decrements the count", () => {
    let state = reducer(
      undefined,
      setNotifications([makeNotification({ id: 1, isRead: false }), makeNotification({ id: 2, isRead: false })]),
    );
    state = reducer(state, markOneRead(1));
    expect(state.notifications.find((n) => n.id === 1)?.isRead).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  it("markOneRead is a no-op for an already-read notification (never goes negative)", () => {
    let state = reducer(undefined, setNotifications([makeNotification({ id: 1, isRead: true })]));
    state = reducer(state, markOneRead(1));
    expect(state.unreadCount).toBe(0);
  });

  it("removeToast filters by toastId", () => {
    let state = reducer(undefined, addNotification(makeNotification({ id: 1 })));
    const toastId = state.toasts[0].toastId;
    state = reducer(state, removeToast(toastId));
    expect(state.toasts).toHaveLength(0);
  });

  it("clearNotifications resets everything", () => {
    let state = reducer(undefined, setNotifications([makeNotification()]));
    state = reducer(state, clearNotifications());
    expect(state).toEqual({ notifications: [], unreadCount: 0, toasts: [] });
  });
});
