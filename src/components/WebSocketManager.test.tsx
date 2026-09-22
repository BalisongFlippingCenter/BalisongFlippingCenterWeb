import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeTestStore, makeProfile } from "../test/testStore";
import { MessageDto } from "../modals/Message";
import WebSocketManager from "./WebSocketManager";

let currentPathname = "/community";
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useLocation: () => ({ pathname: currentPathname }) };
});

class MockClient {
  static instances: MockClient[] = [];
  config: any;
  active = false;
  subscriptions: Record<string, (frame: { body: string }) => void> = {};
  constructor(config: any) {
    this.config = config;
    MockClient.instances.push(this);
  }
  activate() {
    this.active = true;
    this.config.onConnect?.();
  }
  deactivate() {
    this.active = false;
  }
  subscribe(destination: string, cb: (frame: { body: string }) => void) {
    this.subscriptions[destination] = cb;
  }
}

vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation((config: any) => new MockClient(config)),
}));

function lastClient(): MockClient {
  return MockClient.instances[MockClient.instances.length - 1];
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

function renderManager(store = makeTestStore("tok", makeProfile({ id: "user-1" }))) {
  render(
    <Provider store={store}>
      <WebSocketManager />
    </Provider>,
  );
  return store;
}

beforeEach(() => {
  MockClient.instances = [];
  currentPathname = "/community";
});

describe("WebSocketManager — connection lifecycle", () => {
  it("does not connect when there is no logged-in user", () => {
    renderManager(makeTestStore(null, null));
    expect(MockClient.instances).toHaveLength(0);
  });

  it("connects and subscribes once a user + access token are present", () => {
    renderManager();
    expect(lastClient().active).toBe(true);
    expect(Object.keys(lastClient().subscriptions)).toEqual(
      expect.arrayContaining(["/user/queue/notifications", "/user/me/queue/messages", "/user/me/queue/conversations"]),
    );
  });

  it("sends the access token as a Bearer auth header", () => {
    renderManager(makeTestStore("my-token", makeProfile({ id: "user-1" })));
    expect(lastClient().config.connectHeaders).toEqual({ Authorization: "Bearer my-token" });
  });
});

describe("WebSocketManager — notification messages", () => {
  it("dispatches a parsed notification into the store", () => {
    const store = renderManager();
    lastClient().subscriptions["/user/queue/notifications"]({
      body: JSON.stringify({ id: 1, type: "POST_LIKED", message: "liked", isRead: false }),
    });
    expect(store.getState().notifications.notifications).toHaveLength(1);
  });

  it("does not throw on an unparseable notification payload", () => {
    const store = renderManager();
    expect(() => lastClient().subscriptions["/user/queue/notifications"]({ body: "not json" })).not.toThrow();
    expect(store.getState().notifications.notifications).toHaveLength(0);
  });
});

describe("WebSocketManager — message routing", () => {
  it("silently adds a message the current user sent themselves", () => {
    const store = renderManager(makeTestStore("tok", makeProfile({ id: "user-1" })));
    lastClient().subscriptions["/user/me/queue/messages"]({
      body: JSON.stringify(makeMessage({ senderId: "user-1", conversationId: "conv-1" })),
    });
    expect(store.getState().messages.messages["conv-1"]).toHaveLength(1);
    expect(store.getState().messages.totalUnread).toBe(0);
    expect(store.getState().messages.messageToasts).toHaveLength(0);
  });

  it("silently adds an incoming message when the viewer is already on that conversation", () => {
    currentPathname = "/messages/conv-1";
    const store = renderManager(makeTestStore("tok", makeProfile({ id: "user-1" })));
    lastClient().subscriptions["/user/me/queue/messages"]({
      body: JSON.stringify(makeMessage({ senderId: "user-2", conversationId: "conv-1" })),
    });
    expect(store.getState().messages.totalUnread).toBe(0);
    expect(store.getState().messages.messageToasts).toHaveLength(0);
  });

  it("bumps unread and shows a toast for an incoming message while elsewhere", () => {
    currentPathname = "/community";
    const store = renderManager(makeTestStore("tok", makeProfile({ id: "user-1" })));
    lastClient().subscriptions["/user/me/queue/messages"]({
      body: JSON.stringify(makeMessage({ senderId: "user-2", conversationId: "conv-1" })),
    });
    expect(store.getState().messages.totalUnread).toBe(1);
    expect(store.getState().messages.messageToasts).toHaveLength(1);
  });

  it("upserts a conversation update", () => {
    const store = renderManager();
    lastClient().subscriptions["/user/me/queue/conversations"]({
      body: JSON.stringify({
        id: "conv-1",
        otherParticipantId: "user-2",
        otherDisplayName: "Other",
        otherIdentifierCode: "1234",
        otherProfileImg: null,
        lastMessagePreview: "hi",
        lastMessageAt: "2026-01-01T00:00:00Z",
        unreadCount: 2,
      }),
    });
    expect(store.getState().messages.conversations).toHaveLength(1);
    expect(store.getState().messages.totalUnread).toBe(2);
  });
});

describe("WebSocketManager — deactivation", () => {
  it("deactivates the client when the user logs out", () => {
    const store = renderManager();
    const client = lastClient();
    expect(client.active).toBe(true);

    act(() => {
      store.dispatch({ type: "auth/logout/fulfilled" });
    });
    expect(client.active).toBe(false);
  });
});
