const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_CLIENT_KEY = import.meta.env.VITE_AI_CLIENT_KEY;

interface StreamAiChatParams {
  sessionId: string;
  message: string;
  accessToken?: string | null;
  currentPath?: string;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export async function streamAiChat({
  sessionId,
  message,
  accessToken,
  currentPath,
  onChunk,
  signal,
}: StreamAiChatParams): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Id": "website",
    "X-Client-Key": AI_CLIENT_KEY,
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sessionId, message, currentPath }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI chat request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
