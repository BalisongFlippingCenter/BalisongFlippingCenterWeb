import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { streamAiChat } from "../../api/aiChat";
import { resetAiChatSessionId } from "../../utils/aiChatSession";
import AiChatWidget from "./AiChatWidget";

vi.mock("../../api/aiChat", () => ({ streamAiChat: vi.fn() }));
vi.mock("../../utils/aiChatSession", () => ({
  getAiChatSessionId: vi.fn(() => "session-1"),
  resetAiChatSessionId: vi.fn(() => "session-2"),
}));

const mockStreamAiChat = vi.mocked(streamAiChat);

function renderWidget(loggedIn = false) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile() : null);
  return renderWithProviders(<AiChatWidget />, store as any);
}

async function openWidget() {
  fireEvent.click(screen.getByRole("button"));
  await screen.findByText("Latch");
}

beforeEach(() => {
  mockStreamAiChat.mockReset();
  vi.mocked(resetAiChatSessionId).mockClear();
});

describe("AiChatWidget — open/close", () => {
  it("starts closed, showing only the trigger button", () => {
    renderWidget();
    expect(screen.queryByText("Latch")).not.toBeInTheDocument();
  });

  it("opens the panel and shows the welcome message", async () => {
    renderWidget();
    await openWidget();
    expect(screen.getByText(/Hey, I'm Latch/)).toBeInTheDocument();
  });

  it("closes the panel via the close button", async () => {
    renderWidget();
    await openWidget();
    fireEvent.click(document.querySelector(".fa-xmark")!.closest("button")!);
    // The shared layoutId exit transition never settles under jsdom's faked
    // layout metrics, so assert on the re-mounted trigger button instead of
    // waiting for the panel to fully unmount.
    expect(document.querySelector('svg path[fill="white"]')).not.toBeNull();
  });
});

describe("AiChatWidget — sending messages", () => {
  it("disables the send button when the input is empty", async () => {
    renderWidget();
    await openWidget();
    const sendButton = document.querySelector(".fa-paper-plane")!.closest("button")!;
    expect(sendButton).toBeDisabled();
  });

  it("sends a message on Enter and streams the assistant response", async () => {
    mockStreamAiChat.mockImplementation(async ({ onChunk }) => {
      onChunk("Hello ");
      onChunk("there!");
    });
    renderWidget(true);
    await openWidget();

    const input = screen.getByPlaceholderText("Ask Latch something...");
    fireEvent.change(input, { target: { value: "hi latch" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockStreamAiChat).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        message: "hi latch",
        accessToken: "tok",
        currentPath: "/",
      }),
    );
    expect(screen.getByText("hi latch")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Hello there!")).toBeInTheDocument());
  });

  it("does not send on Enter when the input is blank", async () => {
    renderWidget();
    await openWidget();
    const input = screen.getByPlaceholderText("Ask Latch something...");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockStreamAiChat).not.toHaveBeenCalled();
  });

  it("shows a fallback message when the stream fails", async () => {
    mockStreamAiChat.mockRejectedValue(new Error("boom"));
    renderWidget();
    await openWidget();

    const input = screen.getByPlaceholderText("Ask Latch something...");
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(screen.getByText("Something went wrong reaching Latch. Please try again.")).toBeInTheDocument(),
    );
  });

  it("renders links inside the assistant response", async () => {
    mockStreamAiChat.mockImplementation(async ({ onChunk }) => {
      onChunk("Check https://example.com/knife and /knives here.");
    });
    renderWidget();
    await openWidget();

    const input = screen.getByPlaceholderText("Ask Latch something...");
    fireEvent.change(input, { target: { value: "links please" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(screen.getByText(/here\.$/)).toBeInTheDocument());
    expect(document.querySelector('a[href="https://example.com/knife"]')).not.toBeNull();
    expect(document.querySelector('a[href="/knives"]')).not.toBeNull();
  });
});

describe("AiChatWidget — clear", () => {
  it("hides the clear button when there are no messages", async () => {
    renderWidget();
    await openWidget();
    expect(screen.queryByTitle("Clear chat")).not.toBeInTheDocument();
  });

  it("clears the conversation and resets the session id", async () => {
    mockStreamAiChat.mockImplementation(async ({ onChunk }) => onChunk("hi"));
    renderWidget();
    await openWidget();

    const input = screen.getByPlaceholderText("Ask Latch something...");
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(screen.getByTitle("Clear chat")).toBeInTheDocument());

    fireEvent.click(screen.getByTitle("Clear chat"));

    expect(resetAiChatSessionId).toHaveBeenCalled();
    expect(screen.getByText(/Hey, I'm Latch/)).toBeInTheDocument();
  });
});
