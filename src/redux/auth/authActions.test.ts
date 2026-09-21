import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { axiosApiInstance } from "../../api/axios";
import { login, registerNewUser, loginWithRefreshToken, logout, verifyAdminLoginCode } from "./authActions";
import authReducer from "./authSlice";

vi.mock("../../api/axios", () => ({
  axiosApiInstance: { request: vi.fn(), get: vi.fn() },
}));

const mockedRequest = axiosApiInstance.request as unknown as ReturnType<typeof vi.fn>;

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

beforeEach(() => {
  mockedRequest.mockReset();
  localStorage.clear();
});

describe("login thunk", () => {
  it("maps the account shape and stores the refresh token on a normal login", async () => {
    mockedRequest.mockResolvedValue({
      data: {
        accessToken: "tok-1",
        refreshToken: "refresh-1",
        account: { accountId: "42", bio: "hi there", measurementUnit: "IMPERIAL" },
      },
    });

    const store = makeStore();
    await store.dispatch(login({ email: "a@b.com", password: "pw" }) as any);

    const state = store.getState().auth;
    expect(state.accessToken).toBe("tok-1");
    expect(state.user?.id).toBe("42");
    expect(state.user?.profileCaption).toBe("hi there");
    expect(state.user?.measurementUnit).toBe("imperial");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-1");
  });

  it("does not store a refresh token when the response omits one", async () => {
    mockedRequest.mockResolvedValue({
      data: { accessToken: "tok-1", account: { accountId: "42" } },
    });
    const store = makeStore();
    await store.dispatch(login({ email: "a@b.com", password: "pw" }) as any);
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("pauses on requiresAdminVerification without establishing a session", async () => {
    mockedRequest.mockResolvedValue({
      data: { requiresAdminVerification: true, email: "admin@example.com" },
    });
    const store = makeStore();
    await store.dispatch(login({ email: "admin@example.com", password: "pw" }) as any);
    const state = store.getState().auth;
    expect(state.pendingAdminVerificationEmail).toBe("admin@example.com");
    expect(state.accessToken).toBeNull();
  });

  it("records the rejection value on failure", async () => {
    mockedRequest.mockRejectedValue({ response: { data: "bad credentials" } });
    const store = makeStore();
    await store.dispatch(login({ email: "a@b.com", password: "wrong" }) as any);
    const state = store.getState().auth;
    expect(state.error).toBe(true);
    expect(state.errorMsg).toBe("bad credentials");
  });
});

describe("registerNewUser thunk", () => {
  it("returns an empty payload for a normal registration", async () => {
    mockedRequest.mockResolvedValue({ data: {} });
    const store = makeStore();
    const result = await store.dispatch(registerNewUser({ email: "a@b.com", displayName: "A", password: "pw" }) as any);
    expect((result as any).payload).toEqual({});
  });

  it("flags requiresAdminVerification when the backend returns it", async () => {
    mockedRequest.mockResolvedValue({ data: { requiresAdminVerification: true, email: "admin@example.com" } });
    const store = makeStore();
    await store.dispatch(registerNewUser({ email: "admin@example.com", displayName: "A", password: "pw" }) as any);
    expect(store.getState().auth.pendingAdminVerificationEmail).toBe("admin@example.com");
  });
});

describe("verifyAdminLoginCode thunk", () => {
  it("establishes a session and stores the refresh token", async () => {
    mockedRequest.mockResolvedValue({
      data: { accessToken: "tok-admin", refreshToken: "refresh-admin", account: { accountId: "1" } },
    });
    const store = makeStore();
    await store.dispatch(verifyAdminLoginCode({ email: "admin@example.com", code: "123456" }) as any);
    const state = store.getState().auth;
    expect(state.accessToken).toBe("tok-admin");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-admin");
  });
});

describe("loginWithRefreshToken thunk", () => {
  it("sends the stored refresh token as a text/plain body when present", async () => {
    localStorage.setItem("refreshToken", "stored-refresh");
    mockedRequest.mockResolvedValue({ data: { accessToken: "tok-2", account: { accountId: "7" } } });
    const store = makeStore();
    await store.dispatch(loginWithRefreshToken() as any);
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: "stored-refresh",
        headers: { "Content-Type": "text/plain" },
      }),
    );
  });

  it("omits the body and content-type header when no refresh token is stored", async () => {
    mockedRequest.mockResolvedValue({ data: { accessToken: "tok-2", account: { accountId: "7" } } });
    const store = makeStore();
    await store.dispatch(loginWithRefreshToken() as any);
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ data: undefined, headers: undefined }),
    );
  });
});

describe("logout thunk", () => {
  it("removes the stored refresh token before calling the backend", async () => {
    localStorage.setItem("refreshToken", "refresh-1");
    mockedRequest.mockResolvedValue({ data: {} });
    const store = makeStore();
    await store.dispatch(logout() as any);
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(store.getState().auth.accessToken).toBeNull();
  });
});
