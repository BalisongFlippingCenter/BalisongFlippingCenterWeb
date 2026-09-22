import { describe, it, expect, beforeEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance, axiosApiInstanceAuth, setStore } from "./axios";
import { makeTestStore } from "../test/testStore";

const authMock = new MockAdapter(axiosApiInstanceAuth);
const plainMock = new MockAdapter(axiosApiInstance);

beforeEach(() => {
  authMock.reset();
  plainMock.reset();
});

describe("axiosApiInstanceAuth request interceptor", () => {
  it("attaches the access token from the store as a Bearer header", async () => {
    setStore(makeTestStore("tok-123") as any);
    authMock.onGet("/secure").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer tok-123");
      return [200, { ok: true }];
    });
    const res = await axiosApiInstanceAuth.get("/secure");
    expect(res.data).toEqual({ ok: true });
  });

  it("omits the Authorization header when there is no access token", async () => {
    setStore(makeTestStore(null) as any);
    authMock.onGet("/secure").reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { ok: true }];
    });
    await axiosApiInstanceAuth.get("/secure");
  });
});

describe("axiosApiInstanceAuth response interceptor (401 refresh flow)", () => {
  it("refreshes the token, updates the store, and retries the original request", async () => {
    const store = makeTestStore("stale-token");
    setStore(store as any);

    let secureCallCount = 0;
    authMock.onGet("/secure").reply((config) => {
      secureCallCount += 1;
      if (config.headers?.Authorization === "Bearer stale-token") {
        return [401];
      }
      if (config.headers?.Authorization === "Bearer fresh-token") {
        return [200, { ok: true }];
      }
      return [500];
    });
    plainMock.onGet("/auth/refresh-access-token").reply(200, "fresh-token");

    const res = await axiosApiInstanceAuth.get("/secure");

    expect(res.data).toEqual({ ok: true });
    expect(secureCallCount).toBe(2);
    expect(store.getState().auth.accessToken).toBe("fresh-token");
  });

  it("logs the user out and clears the collection when the refresh itself fails", async () => {
    const store = makeTestStore("stale-token");
    setStore(store as any);

    authMock.onGet("/secure").reply(401);
    plainMock.onGet("/auth/refresh-access-token").reply(401);
    plainMock.onPost("/auth/logout").reply(200);

    await expect(axiosApiInstanceAuth.get("/secure")).rejects.toBeTruthy();

    expect(store.getState().auth.accessToken).toBeNull();
    expect(store.getState().collection.collection).toBeNull();
  });

  it("only retries once per request (does not loop on a second 401)", async () => {
    const store = makeTestStore("stale-token");
    setStore(store as any);

    let secureCallCount = 0;
    authMock.onGet("/secure").reply(() => {
      secureCallCount += 1;
      return [401];
    });
    plainMock.onGet("/auth/refresh-access-token").reply(200, "fresh-token");

    await expect(axiosApiInstanceAuth.get("/secure")).rejects.toBeTruthy();
    expect(secureCallCount).toBe(2);
  });

  it("passes through non-401 errors unchanged", async () => {
    setStore(makeTestStore("tok") as any);
    authMock.onGet("/broken").reply(500);
    await expect(axiosApiInstanceAuth.get("/broken")).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
