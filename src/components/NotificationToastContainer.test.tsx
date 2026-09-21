import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore } from "../test/testStore";
import { addNotification, AppNotification } from "../redux/notifications/notificationSlice";
import { receiveIncomingMessage } from "../redux/messages/messagesSlice";
import { setConversations } from "../redux/messages/messagesSlice";
import { ConversationDto, MessageDto } from "../modals/Message";
import NotificationToastContainer from "./NotificationToastContainer";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

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

function makeMessage(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "user-2",
    body: "hello",
    mediaUrl: null,
    isVideo: false,
    replyToId: null,
    replyPreviewBody: null,
    replyPreviewSenderName: null,
    editedAt: null,
    isDeleted: false,
    sentAt: "2026-01-01T00:00:00Z",
    readAt: null,
    ...overrides,
  };
}

function makeConversation(overrides: Partial<ConversationDto> = {}): ConversationDto {
  return {
    id: "conv-1",
    otherParticipantId: "user-2",
    otherDisplayName: "Other User",
    otherIdentifierCode: "5678",
    otherProfileImg: null,
    lastMessagePreview: "hey",
    lastMessageAt: "2026-01-01T00:00:00Z",
    unreadCount: 0,
    ...overrides,
  };
}

beforeEach(() => {
  mockNavigate.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NotificationToastContainer — content mapping", () => {
  it("shows the actor name and mapped action text for each notification type", () => {
    const store = makeTestStore();
    store.dispatch(addNotification(makeNotification({ type: "NEW_FOLLOWER" })));
    renderWithProviders(<NotificationToastContainer />, store as any);
    expect(screen.getByText("started following you")).toBeInTheDocument();
    expect(screen.getByText("someone")).toBeInTheDocument();
  });

  it("navigates to the actor's profile and dismisses on click for a follow notification", () => {
    const store = makeTestStore();
    store.dispatch(addNotification(makeNotification({ type: "NEW_FOLLOWER" })));
    renderWithProviders(<NotificationToastContainer />, store as any);

    fireEvent.click(screen.getByText("started following you"));
    expect(mockNavigate).toHaveBeenCalledWith("/someone/1234");
    expect(store.getState().notifications.toasts).toHaveLength(0);
  });

  it("navigates to the post for a like/comment notification", () => {
    const store = makeTestStore();
    store.dispatch(addNotification(makeNotification({ type: "POST_LIKED", targetId: 42 })));
    renderWithProviders(<NotificationToastContainer />, store as any);
    fireEvent.click(screen.getByText("liked your post"));
    expect(mockNavigate).toHaveBeenCalledWith("/post/42");
  });

  it("navigates to the comments-focused post for a reply notification", () => {
    const store = makeTestStore();
    store.dispatch(addNotification(makeNotification({ type: "COMMENT_REPLIED", targetId: 42 })));
    renderWithProviders(<NotificationToastContainer />, store as any);
    fireEvent.click(screen.getByText("replied to your comment"));
    expect(mockNavigate).toHaveBeenCalledWith("/post/42?focus=comments");
  });

  it("dismiss button stops propagation and does not navigate", () => {
    const store = makeTestStore();
    store.dispatch(addNotification(makeNotification()));
    renderWithProviders(<NotificationToastContainer />, store as any);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(store.getState().notifications.toasts).toHaveLength(0);
  });
});

describe("NotificationToastContainer — auto-dismiss timing", () => {
  it("auto-dismisses a notification toast after 4.5s", () => {
    const store = makeTestStore();
    store.dispatch(addNotification(makeNotification()));
    renderWithProviders(<NotificationToastContainer />, store as any);
    act(() => {
      vi.advanceTimersByTime(4500);
    });
    expect(store.getState().notifications.toasts).toHaveLength(0);
  });

  it("auto-dismisses a message toast after 5s", () => {
    const store = makeTestStore();
    store.dispatch(setConversations([makeConversation()]));
    store.dispatch(receiveIncomingMessage(makeMessage()));
    renderWithProviders(<NotificationToastContainer />, store as any);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(store.getState().messages.messageToasts).toHaveLength(0);
  });
});

describe("NotificationToastContainer — message toasts", () => {
  it("shows the sender name and preview, and navigates to the conversation on click", () => {
    const store = makeTestStore();
    store.dispatch(setConversations([makeConversation({ otherDisplayName: "Alice" })]));
    store.dispatch(receiveIncomingMessage(makeMessage({ body: "hi there" })));
    renderWithProviders(<NotificationToastContainer />, store as any);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("hi there")).toBeInTheDocument();
    fireEvent.click(screen.getByText("hi there"));
    expect(mockNavigate).toHaveBeenCalledWith("/messages/conv-1");
  });
});

describe("NotificationToastContainer — visibility caps", () => {
  it("shows only the last 4 notification toasts", () => {
    const store = makeTestStore();
    for (let i = 0; i < 6; i++) {
      store.dispatch(addNotification(makeNotification({ id: i, actorDisplayName: `user${i}` })));
    }
    renderWithProviders(<NotificationToastContainer />, store as any);
    expect(screen.queryByText("user0")).not.toBeInTheDocument();
    expect(screen.queryByText("user1")).not.toBeInTheDocument();
    expect(screen.getByText("user5")).toBeInTheDocument();
  });

  it("shows only the last 2 message toasts", () => {
    const store = makeTestStore();
    store.dispatch(setConversations([makeConversation({ id: "conv-1" }), makeConversation({ id: "conv-2" }), makeConversation({ id: "conv-3" })]));
    store.dispatch(receiveIncomingMessage(makeMessage({ id: "m1", conversationId: "conv-1", body: "one" })));
    store.dispatch(receiveIncomingMessage(makeMessage({ id: "m2", conversationId: "conv-2", body: "two" })));
    store.dispatch(receiveIncomingMessage(makeMessage({ id: "m3", conversationId: "conv-3", body: "three" })));
    renderWithProviders(<NotificationToastContainer />, store as any);
    expect(screen.queryByText("one")).not.toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    expect(screen.getByText("three")).toBeInTheDocument();
  });
});
