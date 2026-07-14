import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AppNotification {
  id: number;
  type: "NEW_FOLLOWER" | "POST_LIKED" | "POST_COMMENTED" | "COMMENT_REPLIED" | "COMMENT_LIKED" | "MESSAGE_RECEIVED";
  message: string;
  targetType: string;
  targetId: number;
  actorDisplayName: string;
  actorIdentifierCode: string;
  actorProfileImg: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationToast {
  toastId: string;
  notification: AppNotification;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: NotificationToast[];
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  toasts: [],
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<AppNotification[]>) {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    addNotification(state, action: PayloadAction<AppNotification>) {
      state.notifications.unshift(action.payload);
      // Message notifications are tracked separately in messagesSlice — exclude here
      if (action.payload.type !== "MESSAGE_RECEIVED") {
        if (!action.payload.isRead) state.unreadCount += 1;
        state.toasts.push({
          toastId: `${action.payload.id}-${Date.now()}`,
          notification: action.payload,
        });
      }
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    markAllRead(state) {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    },
    markOneRead(state, action: PayloadAction<number>) {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n && !n.isRead) {
        n.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.toastId !== action.payload);
    },
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
      state.toasts = [];
    },
  },
});

export const {
  setNotifications, addNotification, setUnreadCount,
  markAllRead, markOneRead, removeToast, clearNotifications,
} = notificationSlice.actions;
export default notificationSlice.reducer;
