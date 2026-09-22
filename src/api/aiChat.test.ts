import { describe, it, expect, vi, afterEach } from "vitest";
import { streamAiChat } from "./aiChat";

function makeStreamingResponse(chunks: string[], ok = true, status = 200) {
  const encoder = new TextEncoder();
  let i = 0;
  const reader = {
    read: vi.fn(async () => {
      if (i < chunks.length) {
        const value = encoder.encode(chunks[i]);
        i += 1;
        return { done: false, value };
      }
      return { done: true, value: undefined };
    }),
  };
  return {
    ok,
    status,
    body: { getReader: () => reader },
  } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("streamAiChat", () => {
  it("sends the client headers and posts the message payload", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(makeStreamingResponse(["hi"]));

    await streamAiChat({
      sessionId: "sess-1",
      message: "hello",
      currentPath: "/catalog",
      onChunk: () => {},
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/ai/chat");
    expect(options?.method).toBe("POST");
    expect(JSON.parse(options?.body as string)).toEqual({
      sessionId: "sess-1",
      message: "hello",
      currentPath: "/catalog",
    });
    const headers = options?.headers as Record<string, string>;
    expect(headers["X-Client-Id"]).toBe("website");
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("attaches an Authorization header when an access token is provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(makeStreamingResponse(["hi"]));
    await streamAiChat({ sessionId: "sess-1", message: "hello", accessToken: "tok-123", onChunk: () => {} });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok-123");
  });

  it("invokes onChunk with each decoded chunk in order", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(makeStreamingResponse(["Hello, ", "world", "!"]));
    const chunks: string[] = [];
    await streamAiChat({ sessionId: "sess-1", message: "hello", onChunk: (c) => chunks.push(c) });
    expect(chunks).toEqual(["Hello, ", "world", "!"]);
  });

  it("throws when the response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(makeStreamingResponse([], false, 500));
    await expect(
      streamAiChat({ sessionId: "sess-1", message: "hello", onChunk: () => {} }),
    ).rejects.toThrow("AI chat request failed (500)");
  });

  it("throws when the response has no body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200, body: null } as unknown as Response);
    await expect(
      streamAiChat({ sessionId: "sess-1", message: "hello", onChunk: () => {} }),
    ).rejects.toThrow("AI chat request failed (200)");
  });
});
