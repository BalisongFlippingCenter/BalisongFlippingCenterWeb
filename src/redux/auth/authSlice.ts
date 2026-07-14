import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Profile } from "../../modals/User";
import {
  login,
  loginWithGoogle,
  loginWithRefreshToken,
  logout,
  registerNewUser,
} from "./authActions";

interface AuthState {
  user: Profile | null;
  accessToken: string | null;
  rememberLoginCredentials: boolean;
  error: boolean;
  errorMsg: string;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  rememberLoginCredentials: false,
  error: false,
  errorMsg: "",
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToRememberLoginInfo: (state) => {
      state.rememberLoginCredentials = true;
      localStorage.setItem("save-user-info", "true");
    },
    toggleOffRememberLoginInfo: (state) => {
      state.rememberLoginCredentials = false;
      localStorage.removeItem("save-user-info");
      localStorage.removeItem("saved-user-email");
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = true;
      state.errorMsg = action.payload;
    },
    clearError: (state) => {
      state.error = false;
      state.errorMsg = "";
    },
    setNewAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setNewUser: (state, action: PayloadAction<Profile>) => {
      state.user = action.payload;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ newUser: Profile; newAccessToken: string }>
    ) => {
      state.user = action.payload.newUser;
      state.accessToken = action.payload.newAccessToken;
    },
    toggleLikedPost: (state, action: PayloadAction<number>) => {
      if (!state.user) return;
      const ids = state.user.likedPostIds ?? [];
      const idx = ids.indexOf(action.payload);
      state.user.likedPostIds = idx === -1 ? [...ids, action.payload] : ids.filter((id) => id !== action.payload);
    },
    toggleLikedComment: (state, action: PayloadAction<number>) => {
      if (!state.user) return;
      const ids = state.user.likedCommentIds ?? [];
      const idx = ids.indexOf(action.payload);
      state.user.likedCommentIds = idx === -1 ? [...ids, action.payload] : ids.filter((id) => id !== action.payload);
    },
    toggleFollowing: (state, action: PayloadAction<number>) => {
      if (!state.user) return;
      const ids = state.user.followingIds ?? [];
      const idx = ids.indexOf(action.payload);
      state.user.followingIds = idx === -1 ? [...ids, action.payload] : ids.filter((id) => id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerNewUser.pending, (state) => {
        // handle registration is loading
        state.loading = true;
      })
      .addCase(registerNewUser.fulfilled, (state) => {
        // handle successful registration
        state.loading = false;
      })
      .addCase(
        registerNewUser.rejected,
        (state, action: PayloadAction<any>) => {
          // handle error in registration
          state.loading = false;
          state.error = true;
          state.errorMsg = action.payload;
        }
      )
      .addCase(login.pending, (state) => {
        // handle login is loading
        state.loading = true;
      })
      .addCase(
        login.fulfilled,
        (
          state,
          action: PayloadAction<{
            accessToken: string;
            account: Profile | null;
          }>
        ) => {
          // handle successful login
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.account;
          state.loading = false;
        }
      )
      .addCase(login.rejected, (state, action: PayloadAction<any>) => {
        // handle error in logging in user
        state.loading = false;
        state.error = true;
        state.errorMsg = action.payload;
      })
      .addCase(loginWithRefreshToken.pending, (state) => {
        // handle login is loading
        state.loading = true;
      })
      .addCase(
        loginWithRefreshToken.fulfilled,
        (
          state,
          action: PayloadAction<{
            accessToken: string;
            account: Profile | null;
          }>
        ) => {
          // handle successful login
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.account;
          state.loading = false;
        }
      )
      .addCase(
        loginWithRefreshToken.rejected,
        (state, action: PayloadAction<any>) => {
          // handle error in logging in user
          state.loading = false;
          state.error = true;
          state.errorMsg = action.payload;
        }
      )
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        loginWithGoogle.fulfilled,
        (state, action: PayloadAction<{ accessToken: string; account: Profile | null }>) => {
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.account;
          state.loading = false;
        }
      )
      .addCase(loginWithGoogle.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = true;
        state.errorMsg = action.payload;
      })
      .addCase(logout.pending, (state) => {
        // handle loading logout
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        // handle successful logout
        state.accessToken = null;
        state.user = null;
        state.loading = false;
      })
      .addCase(logout.rejected, (state) => {
        // handle error from backend in logging out user
        state.loading = false;
        state.accessToken = null;
        state.user = null;
      });
  },
});

export const {
  setToRememberLoginInfo,
  toggleOffRememberLoginInfo,
  setError,
  clearError,
  setNewAccessToken,
  setNewUser,
  setCredentials,
  toggleLikedPost,
  toggleLikedComment,
  toggleFollowing,
} = authSlice.actions;

export default authSlice.reducer;
