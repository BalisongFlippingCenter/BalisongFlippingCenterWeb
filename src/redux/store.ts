import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import collectionReducer from "./collection/collectionSlice";
import notificationReducer from "./notifications/notificationSlice";
import uiToastReducer from "./uiToast/uiToastSlice";
import messagesReducer from "./messages/messagesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    collection: collectionReducer,
    notifications: notificationReducer,
    uiToast: uiToastReducer,
    messages: messagesReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
