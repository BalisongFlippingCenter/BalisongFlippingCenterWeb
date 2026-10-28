import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { axiosApiInstance } from "../../api/axios";
import { login, registerNewUser, loginWithRefreshToken, logout, verifyAdminLoginCode, loginWithGoogle, hasStoredSession } from "./authActions";
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
  it("maps the account shape and records a session on a normal login", async () => {
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
    expect(localStorage.getItem("hasSession")).toBe("true");
  });

  it("never stores the refresh token, even when the response includes one", async () => {
    mockedRequest.mockResolvedValue({
      data: { accessToken: "tok-1", refreshToken: "refresh-1", account: { accountId: "42" } },
    });
    const store = makeStore();
    await store.dispatch(login({ email: "a@b.com", password: "pw" }) as any);
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain("refresh-1");
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
    expect(localStorage.getItem("hasSession")).toBeNull();
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
  it("establishes a session and records it without storing the refresh token", async () => {
    mockedRequest.mockResolvedValue({
      data: { accessToken: "tok-admin", refreshToken: "refresh-admin", account: { accountId: "1" } },
    });
    const store = makeStore();
    await store.dispatch(verifyAdminLoginCode({ email: "admin@example.com", code: "123456" }) as any);
    const state = store.getState().auth;
    expect(state.accessToken).toBe("tok-admin");
    expect(localStorage.getItem("hasSession")).toBe("true");
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});

describe("loginWithGoogle thunk", () => {
  it("records a session without storing the refresh token", async () => {
    mockedRequest.mockResolvedValue({
      data: { accessToken: "tok-g", refreshToken: "refresh-g", account: { accountId: "3" } },
    });
    const store = makeStore();
    await store.dispatch(loginWithGoogle("google-token") as any);
    expect(localStorage.getItem("hasSession")).toBe("true");
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});

describe("loginWithRefreshToken thunk", () => {
  it("relies on the cookie and sends no body", async () => {
    mockedRequest.mockResolvedValue({ data: { accessToken: "tok-2", account: { accountId: "7" } } });
    const store = makeStore();
    await store.dispatch(loginWithRefreshToken() as any);
    expect(mockedRequest).toHaveBeenCalledWith({ url: "auth/refresh-token-login", method: "post" });
    expect(localStorage.getItem("hasSession")).toBe("true");
  });

  it("clears the session flag when the cookie is missing or expired", async () => {
    localStorage.setItem("hasSession", "true");
    mockedRequest.mockRejectedValue({ response: { data: "Unauthorized" } });
    const store = makeStore();
    await store.dispatch(loginWithRefreshToken() as any);
    expect(localStorage.getItem("hasSession")).toBeNull();
  });
});

describe("hasStoredSession", () => {
  it("is false for a browser that has never logged in", () => {
    expect(hasStoredSession()).toBe(false);
  });

  it("is true when the session flag is set", () => {
    localStorage.setItem("hasSession", "true");
    expect(hasStoredSession()).toBe(true);
  });

  it("treats a legacy stored refresh token as a session once, then deletes it", () => {
    localStorage.setItem("refreshToken", "legacy-token");
    expect(hasStoredSession()).toBe(true);
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(hasStoredSession()).toBe(false);
  });
});

describe("logout thunk", () => {
  it("clears the session flag before calling the backend", async () => {
    localStorage.setItem("hasSession", "true");
    mockedRequest.mockResolvedValue({ data: {} });
    const store = makeStore();
    await store.dispatch(logout() as any);
    expect(localStorage.getItem("hasSession")).toBeNull();
    expect(store.getState().auth.accessToken).toBeNull();
  });
});
