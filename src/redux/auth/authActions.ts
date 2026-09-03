import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApiInstance } from "../../api/axios";
import { Profile } from "../../modals/User";

// Maps backend field names → frontend Profile field names
const mapAccount = (account: any): Profile => ({
  ...account,
  id:             account.id             ?? account.accountId     ?? null,
  profileCaption: account.profileCaption ?? account.bio           ?? null,
  measurementUnit: account.measurementUnit?.toLowerCase()         ?? null,
  likedPostIds:   account.likedPostIds   ?? [],
  likedCommentIds: account.likedCommentIds ?? [],
  followingIds:   account.followingIds   ?? [],
  postCount:      account.postCount      ?? 0,
  followerCount:  account.followerCount  ?? 0,
  followingCount: account.followingCount ?? 0,
});

interface RegistrationPayload {
  email: string;
  displayName: string | null;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface VerifyAdminLoginPayload {
  email: string;
  code: string;
}

export const registerNewUser = createAsyncThunk(
  "auth/register",
  async (payload: RegistrationPayload, thunkAPI) => {
    try {
      const response = await axiosApiInstance.request({
        url: "/auth/register",
        method: "post",
        data: payload,
      });

      // the reserved admin email must verify by code before the account is usable
      if (response.data?.requiresAdminVerification) {
        return { requiresAdminVerification: true, email: response.data.email };
      }

      return {};
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, thunkAPI) => {
    try {
      const response = await axiosApiInstance.request({
        url: "/auth/login",
        method: "post",
        withCredentials: true,
        data: payload,
      });

      // admin accounts get a challenge response instead of tokens — no account/session data yet
      if (response.data.requiresAdminVerification) {
        return { requiresAdminVerification: true, email: response.data.email };
      }

      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

return { ...response.data, account: mapAccount(response.data.account) };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const verifyAdminLoginCode = createAsyncThunk(
  "auth/verifyAdminLoginCode",
  async (payload: VerifyAdminLoginPayload, thunkAPI) => {
    try {
      const response = await axiosApiInstance.request({
        url: "/auth/verify-admin-login",
        method: "post",
        withCredentials: true,
        data: payload,
      });

      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      return { ...response.data, account: mapAccount(response.data.account) };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const loginWithRefreshToken = createAsyncThunk(
  "auth/loginWithRefreshToken",
  async (_, thunkAPI) => {
    try {
      const storedToken = localStorage.getItem("refreshToken");
      const response = await axiosApiInstance.request({
        url: "auth/refresh-token-login",
        method: "post",
        data: storedToken ?? undefined,
        headers: storedToken ? { "Content-Type": "text/plain" } : undefined,
      });

      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

return { ...response.data, account: mapAccount(response.data.account) };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Payload: Google access token from useGoogleLogin (implicit flow)
// Backend: POST /auth/google — verify token, find-or-create user, return same shape as /auth/login
// Response shape: { accessToken, account, collection, isNewUser? }
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (googleAccessToken: string, thunkAPI) => {
    try {
      const response = await axiosApiInstance.request({
        url: "/auth/google",
        method: "post",
        withCredentials: true,
        data: { googleAccessToken },
      });

      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      return { ...response.data, account: mapAccount(response.data.account) };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data ?? "Google login failed");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("refreshToken");
  await axiosApiInstance.request({
    url: "/auth/logout",
    method: "post",
    withCredentials: true,
  });
});
