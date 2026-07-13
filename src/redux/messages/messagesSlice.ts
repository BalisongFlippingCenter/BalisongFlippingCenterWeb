import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConversationDto, MessageDto } from "../../modals/Message";

interface MessagesState {
  conversations:  ConversationDto[];
  messages:       Record<string, MessageDto[]>; // keyed by conversationId
  totalUnread:    number;
}

const initialState: MessagesState = {
  conversations: [],
  messages:      {},
  totalUnread:   0,
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
        const prev = state.conversations[idx];
        state.totalUnread += action.payload.unreadCount - prev.unreadCount;
        state.conversations[idx] = action.payload;
      } else {
        state.conversations.unshift(action.payload);
        state.totalUnread += action.payload.unreadCount;
      }
      // Keep sorted by most recent
      state.conversations.sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    },

    // Called by WS /user/me/queue/messages — append new message to thread
    addMessage(state, action: PayloadAction<MessageDto>) {
      const { conversationId } = action.payload;
      if (!state.messages[conversationId]) state.messages[conversationId] = [];
      state.messages[conversationId].push(action.payload);
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
  setMessages,
  prependMessages,
  markConversationRead,
  setTotalUnread,
} = messagesSlice.actions;

export default messagesSlice.reducer;
