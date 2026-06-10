import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApiInstance } from "../../api/axios";
import { Profile } from "../../modals/User";

// Maps backend field names → frontend Profile field names
const mapAccount = (account: any): Profile => ({
  ...account,
  profileCaption: account.profileCaption ?? account.bio ?? null,
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

export const registerNewUser = createAsyncThunk(
  "auth/register",
  async (payload: RegistrationPayload, thunkAPI) => {
    console.log(payload);
    try {
      await axiosApiInstance.request({
        url: "/auth/register",
        method: "post",
        data: payload,
      });
    } catch (error: any) {
      console.log(error.response.data);
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
      const response = await axiosApiInstance.request({
        url: "auth/refresh-token-login",
        method: "post",
      });

      return { ...response.data, account: mapAccount(response.data.account) };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await axiosApiInstance.request({
    url: "/auth/logout",
    method: "post",
    withCredentials: true,
  });
});
