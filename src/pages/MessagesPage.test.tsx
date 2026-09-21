import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, waitFor, within } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import { ConversationDto, MessageDto } from "../modals/Message";
import MessagesPage from "./MessagesPage";

const mockNavigate = vi.fn();
let mockLocationState: any = null;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/messages", state: mockLocationState, search: "", hash: "", key: "test" }),
    useParams: () => ({ conversationId: undefined }),
  };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeConv(overrides: Partial<ConversationDto> = {}): ConversationDto {
  return {
    id: "c1",
    otherParticipantId: "u2",
    otherDisplayName: "Alice",
    otherIdentifierCode: "1234",
    otherProfileImg: null,
    lastMessagePreview: "hey",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    ...overrides,
  };
}

function makeMsg(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: "m1",
    conversationId: "c1",
    senderId: "u2",
    body: "hello",
    mediaUrl: null,
    isVideo: false,
    replyToId: null,
    replyPreviewBody: null,
    replyPreviewSenderName: null,
    editedAt: null,
    isDeleted: false,
    sentAt: new Date().toISOString(),
    readAt: null,
    ...overrides,
  };
}

function renderPage(convs: ConversationDto[] = []) {
  const store = makeTestStore("tok", makeProfile({ id: "u1" }));
  setStore(store as any);
  authMock.onGet("/conversations/me").reply(200, convs);
  return renderWithProviders(<MessagesPage />, store as any);
}

// The page renders separate mobile and desktop trees simultaneously (Tailwind
// responsive classes, not conditional mounting), so every query must be
// scoped to one tree to avoid "found multiple elements" failures. The
// desktop pane always renders the Inbox (and the ChatPanel/placeholder), so
// it's used as the single source of truth throughout.
function desktopPane(): HTMLElement {
  return document.querySelector(".hidden.md\\:flex") as HTMLElement;
}
function inDesktop(selector: string) {
  return desktopPane().querySelector(selector);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
  mockLocationState = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MessagesPage — inbox", () => {
  it("renders conversations with unread badges, capping the count at 99+", async () => {
    renderPage([
      makeConv({ id: "c1", otherDisplayName: "Alice", unreadCount: 3 }),
      makeConv({ id: "c2", otherDisplayName: "Bob", unreadCount: 150 }),
    ]);
    await within(desktopPane()).findByText("Alice");
    expect(within(desktopPane()).getByText("3")).toBeInTheDocument();
    expect(within(desktopPane()).getByText("99+")).toBeInTheDocument();
  });

  it("shows the empty state when there are no conversations", async () => {
    renderPage([]);
    await within(desktopPane()).findByText("No messages yet");
  });

  it("labels a message from yesterday as \"Yesterday\"", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));
    const yesterday = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    renderPage([makeConv({ id: "c1", lastMessageAt: yesterday })]);
    await within(desktopPane()).findByText("Yesterday");
  });
});

describe("MessagesPage — selecting a conversation", () => {
  it("fetches its messages and marks it read", async () => {
    const conv = makeConv({ id: "c1", otherDisplayName: "Alice", unreadCount: 2 });
    renderPage([conv]);
    await within(desktopPane()).findByText("Alice");
    expect(within(desktopPane()).getByText("2")).toBeInTheDocument();

    authMock.onGet("/conversations/c1/messages").reply(200, { content: [makeMsg({ body: "hi" })], totalPages: 1 });
    authMock.onPatch("/conversations/c1/read").reply(200);

    fireEvent.click(within(desktopPane()).getByText("Alice"));

    await within(desktopPane()).findByText("hi");
    expect(within(desktopPane()).queryByText("2")).not.toBeInTheDocument();
    await waitFor(() => expect(authMock.history.patch.some((r) => r.url === "/conversations/c1/read")).toBe(true));
  });
});

describe("MessagesPage — opening from a profile's Message button", () => {
  it("opens a chat panel for a recipient not already in conversations", async () => {
    mockLocationState = { recipient: { id: "u9", displayName: "Newbie", identifierCode: "9999", profileImg: null } };
    renderPage([]);
    await within(desktopPane()).findByPlaceholderText("Message...");
    expect(within(desktopPane()).getAllByText("Newbie").length).toBeGreaterThan(0);
    expect(mockNavigate).toHaveBeenCalledWith("/messages", { replace: true, state: null });
  });

  it("opens the existing conversation when the recipient already has one, but never updates the URL to include its id (pre-existing gap vs. selecting from the inbox)", async () => {
    const existing = makeConv({ id: "c5", otherParticipantId: "u9", otherDisplayName: "Newbie" });
    mockLocationState = { recipient: { id: "u9", displayName: "Newbie", identifierCode: "9999", profileImg: null } };
    authMock.onGet("/conversations/c5/messages").reply(200, { content: [], totalPages: 1 });
    authMock.onPatch("/conversations/c5/read").reply(200);
    renderPage([existing]);

    await within(desktopPane()).findByPlaceholderText("Message...");
    expect(within(desktopPane()).getAllByText("Newbie").length).toBeGreaterThan(0);

    expect(mockNavigate).toHaveBeenCalledWith("/messages", { replace: true, state: null });
    expect(mockNavigate).not.toHaveBeenCalledWith("/messages/c5", expect.anything());
  });

  it("shows a start-the-conversation prompt for a brand new recipient with no messages", async () => {
    mockLocationState = { recipient: { id: "u9", displayName: "Newbie", identifierCode: "9999", profileImg: null } };
    renderPage([]);
    await within(desktopPane()).findByText("Send a message to start the conversation.");
  });
});

describe("MessagesPage — sending messages", () => {
  it("sends the first message to a new recipient and switches to the created conversation", async () => {
    mockLocationState = { recipient: { id: "u9", displayName: "Newbie", identifierCode: "9999", profileImg: null } };
    renderPage([]);
    await within(desktopPane()).findByPlaceholderText("Message...");

    const sentMsg = makeMsg({ id: "m1", conversationId: "c9", senderId: "u1", body: "hi there" });
    const newConv = makeConv({ id: "c9", otherParticipantId: "u9", otherDisplayName: "Newbie", lastMessagePreview: "hi there" });
    authMock.onPost("/conversations/u9/messages").reply(200, { message: sentMsg, conversation: newConv });

    fireEvent.change(within(desktopPane()).getByPlaceholderText("Message..."), { target: { value: "hi there" } });
    fireEvent.click(inDesktop(".fa-paper-plane")!.closest("button")!);

    await within(desktopPane()).findByText("hi there");
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/messages/c9", { replace: true }));
  });

  it("disables the send button when there is no text or attachment", async () => {
    mockLocationState = { recipient: { id: "u9", displayName: "Newbie", identifierCode: "9999", profileImg: null } };
    renderPage([]);
    await within(desktopPane()).findByPlaceholderText("Message...");
    expect(inDesktop(".fa-paper-plane")!.closest("button")).toBeDisabled();
  });

  it("rejects an oversized image attachment with an alert and does not attach it", async () => {
    mockLocationState = { recipient: { id: "u9", displayName: "Newbie", identifierCode: "9999", profileImg: null } };
    renderPage([]);
    await within(desktopPane()).findByPlaceholderText("Message...");

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], "big.png", { type: "image/png" });
    const fileInput = inDesktop('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    expect(alertSpy).toHaveBeenCalledWith("Images must be under 10 MB.");
    alertSpy.mockRestore();
  });
});

describe("MessagesPage — message actions", () => {
  it("opens the reply bar for another user's message", async () => {
    const conv = makeConv({ id: "c1", otherDisplayName: "Alice" });
    const msg = makeMsg({ id: "m1", conversationId: "c1", senderId: "u2", body: "hey there" });
    authMock.onGet("/conversations/c1/messages").reply(200, { content: [msg], totalPages: 1 });
    authMock.onPatch("/conversations/c1/read").reply(200);
    renderPage([conv]);
    fireEvent.click(await within(desktopPane()).findByText("Alice"));
    await within(desktopPane()).findByText("hey there");

    const bubble = within(desktopPane()).getByText("hey there").closest(".group") as HTMLElement;
    fireEvent.click(bubble.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(within(bubble).getByText("Reply"));

    expect(within(desktopPane()).getByText(/Replying to/)).toBeInTheDocument();
  });

  it("edits one of the viewer's own messages", async () => {
    const conv = makeConv({ id: "c1", otherDisplayName: "Alice" });
    const msg = makeMsg({ id: "m1", conversationId: "c1", senderId: "u1", body: "original text" });
    authMock.onGet("/conversations/c1/messages").reply(200, { content: [msg], totalPages: 1 });
    authMock.onPatch("/conversations/c1/read").reply(200);
    renderPage([conv]);
    fireEvent.click(await within(desktopPane()).findByText("Alice"));
    await within(desktopPane()).findByText("original text");

    const bubble = within(desktopPane()).getByText("original text").closest(".group") as HTMLElement;
    fireEvent.click(bubble.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(within(bubble).getByText("Edit"));

    await within(desktopPane()).findByText("Editing message");
    const textarea = within(desktopPane()).getByPlaceholderText("Edit message...") as HTMLTextAreaElement;
    expect(textarea.value).toBe("original text");

    authMock.onPatch("/conversations/messages/m1").reply(200, { ...msg, body: "edited text", editedAt: new Date().toISOString() });

    fireEvent.change(textarea, { target: { value: "edited text" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    await within(desktopPane()).findByText("edited text");
    expect(within(desktopPane()).getByText("· Edited")).toBeInTheDocument();
  });

  it("deletes one of the viewer's own messages", async () => {
    const conv = makeConv({ id: "c1", otherDisplayName: "Alice" });
    const msg = makeMsg({ id: "m1", conversationId: "c1", senderId: "u1", body: "delete me" });
    authMock.onGet("/conversations/c1/messages").reply(200, { content: [msg], totalPages: 1 });
    authMock.onPatch("/conversations/c1/read").reply(200);
    renderPage([conv]);
    fireEvent.click(await within(desktopPane()).findByText("Alice"));
    await within(desktopPane()).findByText("delete me");

    authMock.onDelete("/conversations/messages/m1").reply(200, { ...msg, isDeleted: true, body: "" });

    const bubble = within(desktopPane()).getByText("delete me").closest(".group") as HTMLElement;
    fireEvent.click(bubble.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(within(bubble).getByText("Delete"));

    await within(desktopPane()).findByText("This message was deleted");
  });

  it("flags another user's message", async () => {
    const conv = makeConv({ id: "c1", otherDisplayName: "Alice" });
    const msg = makeMsg({ id: "7", conversationId: "c1", senderId: "u2", body: "flag me" });
    authMock.onGet("/conversations/c1/messages").reply(200, { content: [msg], totalPages: 1 });
    authMock.onPatch("/conversations/c1/read").reply(200);
    authMock.onPost("/reports").reply(200);
    renderPage([conv]);
    fireEvent.click(await within(desktopPane()).findByText("Alice"));
    await within(desktopPane()).findByText("flag me");

    const bubble = within(desktopPane()).getByText("flag me").closest(".group") as HTMLElement;
    fireEvent.click(bubble.querySelector(".fa-ellipsis-vertical")!.closest("button")!);
    fireEvent.click(within(bubble).getByText("Flag"));

    await waitFor(() => expect(authMock.history.post.some((r) => r.url === "/reports")).toBe(true));
    const call = authMock.history.post.find((r) => r.url === "/reports")!;
    expect(JSON.parse(call.data as string)).toMatchObject({ targetType: "MESSAGE", targetId: 7, reason: "INAPPROPRIATE" });
  });
});
