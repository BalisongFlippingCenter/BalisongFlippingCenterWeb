const SESSION_KEY = "bfc-ai-chat-session-id";

export function getAiChatSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetAiChatSessionId(): string {
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}
