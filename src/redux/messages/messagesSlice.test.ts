import { describe, it, expect } from "vitest";
import reducer, {
  setConversations,
  upsertConversation,
  addMessage,
  updateMessage,
  receiveIncomingMessage,
  removeMessageToast,
  setMessages,
  prependMessages,
  markConversationRead,
  setTotalUnread,
} from "./messagesSlice";
import { ConversationDto, MessageDto } from "../../modals/Message";

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

describe("messagesSlice", () => {
  it("setConversations sums unreadCount across conversations", () => {
    const state = reducer(
      undefined,
      setConversations([makeConversation({ id: "a", unreadCount: 2 }), makeConversation({ id: "b", unreadCount: 3 })]),
    );
    expect(state.totalUnread).toBe(5);
  });

  it("upsertConversation inserts a new conversation and recomputes totalUnread", () => {
    let state = reducer(undefined, setConversations([makeConversation({ id: "a", unreadCount: 1 })]));
    state = reducer(state, upsertConversation(makeConversation({ id: "b", unreadCount: 4 })));
    expect(state.conversations).toHaveLength(2);
    expect(state.totalUnread).toBe(5);
  });

  it("upsertConversation replaces an existing conversation in place", () => {
    let state = reducer(undefined, setConversations([makeConversation({ id: "a", unreadCount: 1 })]));
    state = reducer(state, upsertConversation(makeConversation({ id: "a", unreadCount: 9 })));
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].unreadCount).toBe(9);
    expect(state.totalUnread).toBe(9);
  });

  it("upsertConversation keeps conversations sorted by most recent lastMessageAt", () => {
    let state = reducer(
      undefined,
      setConversations([
        makeConversation({ id: "old", lastMessageAt: "2026-01-01T00:00:00Z" }),
        makeConversation({ id: "newer", lastMessageAt: "2026-01-02T00:00:00Z" }),
      ]),
    );
    state = reducer(state, upsertConversation(makeConversation({ id: "newest", lastMessageAt: "2026-01-03T00:00:00Z" })));
    expect(state.conversations.map((c) => c.id)).toEqual(["newest", "newer", "old"]);
  });

  it("receiveIncomingMessage appends the message, bumps totalUnread, and queues a toast using conversation info", () => {
    let state = reducer(undefined, setConversations([makeConversation({ id: "conv-1", otherDisplayName: "Alice" })]));
    state = reducer(state, receiveIncomingMessage(makeMessage({ body: "hi there" })));
    expect(state.messages["conv-1"]).toHaveLength(1);
    expect(state.totalUnread).toBe(1);
    expect(state.messageToasts).toHaveLength(1);
    expect(state.messageToasts[0].senderName).toBe("Alice");
    expect(state.messageToasts[0].preview).toBe("hi there");
  });

  it("receiveIncomingMessage truncates long previews to 77 chars + ellipsis", () => {
    const longBody = "a".repeat(100);
    const state = reducer(undefined, receiveIncomingMessage(makeMessage({ body: longBody })));
    expect(state.messageToasts[0].preview).toBe("a".repeat(77) + "…");
  });

  it("receiveIncomingMessage falls back to [Video]/[Photo] preview when body is empty", () => {
    const videoState = reducer(undefined, receiveIncomingMessage(makeMessage({ body: "", isVideo: true })));
    expect(videoState.messageToasts[0].preview).toBe("[Video]");

    const photoState = reducer(undefined, receiveIncomingMessage(makeMessage({ body: "", isVideo: false })));
    expect(photoState.messageToasts[0].preview).toBe("[Photo]");
  });

  it("receiveIncomingMessage falls back to defaults when the conversation isn't known yet", () => {
    const state = reducer(undefined, receiveIncomingMessage(makeMessage()));
    expect(state.messageToasts[0].senderName).toBe("New message");
    expect(state.messageToasts[0].senderCode).toBe("");
  });

  it("addMessage appends without touching totalUnread or toasts", () => {
    const state = reducer(undefined, addMessage(makeMessage()));
    expect(state.messages["conv-1"]).toHaveLength(1);
    expect(state.totalUnread).toBe(0);
    expect(state.messageToasts).toHaveLength(0);
  });

  it("updateMessage replaces a message in place by id", () => {
    let state = reducer(undefined, addMessage(makeMessage({ id: "msg-1", body: "original" })));
    state = reducer(state, updateMessage(makeMessage({ id: "msg-1", body: "edited" })));
    expect(state.messages["conv-1"][0].body).toBe("edited");
  });

  it("updateMessage is a no-op when the conversation has no messages loaded", () => {
    const state = reducer(undefined, updateMessage(makeMessage()));
    expect(state.messages["conv-1"]).toBeUndefined();
  });

  it("removeMessageToast filters by toastId", () => {
    let state = reducer(undefined, receiveIncomingMessage(makeMessage()));
    const toastId = state.messageToasts[0].toastId;
    state = reducer(state, removeMessageToast(toastId));
    expect(state.messageToasts).toHaveLength(0);
  });

  it("setMessages and prependMessages manage history per conversation", () => {
    let state = reducer(undefined, setMessages({ conversationId: "conv-1", messages: [makeMessage({ id: "msg-2" })] }));
    expect(state.messages["conv-1"]).toHaveLength(1);
    state = reducer(state, prependMessages({ conversationId: "conv-1", messages: [makeMessage({ id: "msg-1" })] }));
    expect(state.messages["conv-1"].map((m) => m.id)).toEqual(["msg-1", "msg-2"]);
  });

  it("markConversationRead zeroes that conversation's unread count and decrements totalUnread, clamped at 0", () => {
    let state = reducer(undefined, setConversations([makeConversation({ id: "a", unreadCount: 3 })]));
    state = reducer(state, markConversationRead("a"));
    expect(state.conversations[0].unreadCount).toBe(0);
    expect(state.totalUnread).toBe(0);
  });

  it("markConversationRead is a no-op for an unknown conversation id", () => {
    let state = reducer(undefined, setConversations([makeConversation({ id: "a", unreadCount: 3 })]));
    state = reducer(state, markConversationRead("does-not-exist"));
    expect(state.totalUnread).toBe(3);
  });

  it("setTotalUnread overwrites the count directly", () => {
    const state = reducer(undefined, setTotalUnread(7));
    expect(state.totalUnread).toBe(7);
  });
});
