import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/auth/authSlice";
import collectionReducer from "../redux/collection/collectionSlice";
import notificationReducer from "../redux/notifications/notificationSlice";
import uiToastReducer from "../redux/uiToast/uiToastSlice";
import messagesReducer from "../redux/messages/messagesSlice";
import { Profile } from "../modals/User";

export function makeTestStore(accessToken: string | null = null, user: Profile | null = null) {
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
        user,
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

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "1",
    email: "user@example.com",
    accountCreationDate: null,
    lastLogin: null,
    role: "USER",
    likedPostIds: [],
    likedCommentIds: [],
    followingIds: [],
    ...overrides,
  };
}
