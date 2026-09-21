import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/auth/authSlice";
import collectionReducer from "../redux/collection/collectionSlice";
import notificationReducer from "../redux/notifications/notificationSlice";
import uiToastReducer from "../redux/uiToast/uiToastSlice";
import messagesReducer from "../redux/messages/messagesSlice";

export function makeTestStore(accessToken: string | null = null) {
  return configureStore({
    reducer: {
      auth: authReducer,
      collection: collectionReducer,
      notifications: notificationReducer,
      uiToast: uiToastReducer,
      messages: messagesReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        accessToken,
        rememberLoginCredentials: false,
        error: false,
        errorMsg: "",
        loading: false,
        pendingAdminVerificationEmail: null,
      },
    },
  });
}
