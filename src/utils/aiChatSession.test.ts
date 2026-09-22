import { describe, it, expect, beforeEach } from "vitest";
import { getAiChatSessionId, resetAiChatSessionId } from "./aiChatSession";

const SESSION_KEY = "bfc-ai-chat-session-id";

beforeEach(() => {
  sessionStorage.clear();
});

describe("getAiChatSessionId", () => {
  it("generates and persists a session id when none exists", () => {
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    const id = getAiChatSessionId();
    expect(id).toBeTruthy();
    expect(sessionStorage.getItem(SESSION_KEY)).toBe(id);
  });

  it("returns the existing session id on subsequent calls", () => {
    const first = getAiChatSessionId();
    const second = getAiChatSessionId();
    expect(second).toBe(first);
  });
});

describe("resetAiChatSessionId", () => {
  it("replaces the stored session id with a new one", () => {
    const original = getAiChatSessionId();
    const reset = resetAiChatSessionId();
    expect(reset).not.toBe(original);
    expect(sessionStorage.getItem(SESSION_KEY)).toBe(reset);
  });
});
