import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConversationDto, MessageDto, MessageToast } from "../../modals/Message";

interface MessagesState {
  conversations:  ConversationDto[];
  messages:       Record<string, MessageDto[]>; // keyed by conversationId
  totalUnread:    number;
  messageToasts:  MessageToast[];
}

const initialState: MessagesState = {
  conversations: [],
  messages:      {},
  totalUnread:   0,
  messageToasts: [],
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setConversations(state, action: PayloadAction<ConversationDto[]>) {
      state.conversations = action.payload;
      state.totalUnread   = action.payload.reduce((sum, c) => sum + c.unreadCount, 0);
    },

    // Called by WS /user/me/queue/conversations — update or insert inbox row
    upsertConversation(state, action: PayloadAction<ConversationDto>) {
      const idx = state.conversations.findIndex((c) => c.id === action.payload.id);
      if (idx >= 0) {
        state.conversations[idx] = action.payload;
      } else {
        state.conversations.unshift(action.payload);
      }
      // Keep sorted by most recent
      state.conversations.sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      // Recompute from source of truth to stay in sync with backend
      state.totalUnread = state.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    },

    // Called by WS when a message arrives from another user and the user is NOT viewing that conversation
    receiveIncomingMessage(state, action: PayloadAction<MessageDto>) {
      const msg = action.payload;
      if (!state.messages[msg.conversationId]) state.messages[msg.conversationId] = [];
      state.messages[msg.conversationId].push(msg);
      state.totalUnread += 1;
      const conv = state.conversations.find((c) => c.id === msg.conversationId);
      state.messageToasts.push({
        toastId:        `msg-${msg.id}-${Date.now()}`,
        conversationId: msg.conversationId,
        senderName:     conv?.otherDisplayName    ?? "New message",
        senderCode:     conv?.otherIdentifierCode ?? "",
        senderImg:      conv?.otherProfileImg     ?? null,
        preview:        msg.body.length > 80 ? msg.body.slice(0, 77) + "…" : msg.body,
      });
    },

    // Called by WS for messages sent by current user (no unread bump, no toast)
    addMessage(state, action: PayloadAction<MessageDto>) {
      const { conversationId } = action.payload;
      if (!state.messages[conversationId]) state.messages[conversationId] = [];
      state.messages[conversationId].push(action.payload);
    },

    removeMessageToast(state, action: PayloadAction<string>) {
      state.messageToasts = state.messageToasts.filter((t) => t.toastId !== action.payload);
    },

    setMessages(state, action: PayloadAction<{ conversationId: string; messages: MessageDto[] }>) {
      state.messages[action.payload.conversationId] = action.payload.messages;
    },

    prependMessages(state, action: PayloadAction<{ conversationId: string; messages: MessageDto[] }>) {
      const existing = state.messages[action.payload.conversationId] ?? [];
      state.messages[action.payload.conversationId] = [...action.payload.messages, ...existing];
    },

    markConversationRead(state, action: PayloadAction<string>) {
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) {
        state.totalUnread = Math.max(0, state.totalUnread - conv.unreadCount);
        conv.unreadCount  = 0;
      }
    },

    setTotalUnread(state, action: PayloadAction<number>) {
      state.totalUnread = action.payload;
    },
  },
});

export const {
  setConversations,
  upsertConversation,
  addMessage,
  receiveIncomingMessage,
  removeMessageToast,
  setMessages,
  prependMessages,
  markConversationRead,
  setTotalUnread,
} = messagesSlice.actions;

export default messagesSlice.reducer;
