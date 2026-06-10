import axios from "axios";
import type { AppStore } from "../redux/store";
import { setNewAccessToken } from "../redux/auth/authSlice";
import { logout } from "../redux/auth/authActions";
import { clearCollection } from "../redux/collection/collectionSlice";

// Store is injected after creation to avoid circular dep:
// axios → store → authSlice → authActions → axios
let store: AppStore;
export const setStore = (s: AppStore) => { store = s; };

// const BASE_URL = "http://localhost:8080";
const PRODUCTION_URL = "http://ec2-3-217-173-234.compute-1.amazonaws.com:8080";

// Unauthenticated instance — for login, register, refresh-token-login
export const axiosApiInstance = axios.create({
  baseURL: PRODUCTION_URL,
  withCredentials: true,
});

// Authenticated instance — attaches Bearer token on every request
export const axiosApiInstanceAuth = axios.create({
  baseURL: PRODUCTION_URL,
  withCredentials: true,
});

// Attach access token to every authenticated request
axiosApiInstanceAuth.interceptors.request.use((config) => {
  const accessToken = store.getState().auth.accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401s — try to refresh the access token, force logout if refresh also fails
axiosApiInstanceAuth.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // GET /auth/refresh-access-token — cookie sent automatically, no body needed
        const refreshResponse = await axiosApiInstance.get(
          "/auth/refresh-access-token"
        );

        const newAccessToken: string = refreshResponse.data;

        // Store new access token in Redux
        store.dispatch(setNewAccessToken(newAccessToken));

        // Update the Authorization header and retry the original request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosApiInstanceAuth(originalRequest);

      } catch {
        // Refresh token also expired or invalid — force full logout
        store.dispatch(logout());
        store.dispatch(clearCollection());
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
