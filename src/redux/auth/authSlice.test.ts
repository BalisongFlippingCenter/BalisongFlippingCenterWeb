import { describe, it, expect, beforeEach } from "vitest";
import reducer, {
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
  cancelAdminVerification,
} from "./authSlice";
import { login, registerNewUser, logout, verifyAdminLoginCode, loginWithRefreshToken } from "./authActions";
import { Profile } from "../../modals/User";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
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

describe("authSlice reducers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("setToRememberLoginInfo flips the flag and persists it to localStorage", () => {
    const state = reducer(undefined, setToRememberLoginInfo());
    expect(state.rememberLoginCredentials).toBe(true);
    expect(localStorage.getItem("save-user-info")).toBe("true");
  });

  it("toggleOffRememberLoginInfo clears the flag and related localStorage keys", () => {
    localStorage.setItem("save-user-info", "true");
    localStorage.setItem("saved-user-email", "user@example.com");
    const state = reducer(undefined, toggleOffRememberLoginInfo());
    expect(state.rememberLoginCredentials).toBe(false);
    expect(localStorage.getItem("save-user-info")).toBeNull();
    expect(localStorage.getItem("saved-user-email")).toBeNull();
  });

  it("setError sets error state and message; clearError resets it", () => {
    let state = reducer(undefined, setError("bad credentials"));
    expect(state.error).toBe(true);
    expect(state.errorMsg).toBe("bad credentials");
    state = reducer(state, clearError());
    expect(state.error).toBe(false);
    expect(state.errorMsg).toBe("");
  });

  it("setNewAccessToken and setNewUser set their fields directly", () => {
    let state = reducer(undefined, setNewAccessToken("tok-123"));
    expect(state.accessToken).toBe("tok-123");
    const user = makeProfile();
    state = reducer(state, setNewUser(user));
    expect(state.user).toBe(user);
  });

  it("setCredentials sets both user and access token together", () => {
    const user = makeProfile();
    const state = reducer(undefined, setCredentials({ newUser: user, newAccessToken: "tok-456" }));
    expect(state.user).toBe(user);
    expect(state.accessToken).toBe("tok-456");
  });

  it("cancelAdminVerification clears the pending email", () => {
    const withPending = reducer(undefined, {
      type: login.fulfilled.type,
      payload: { requiresAdminVerification: true, email: "admin@example.com" },
    });
    const state = reducer(withPending, cancelAdminVerification());
    expect(state.pendingAdminVerificationEmail).toBeNull();
  });

  describe("toggleLikedPost / toggleLikedComment / toggleFollowing", () => {
    it("are no-ops when there is no logged-in user", () => {
      const state = reducer(undefined, toggleLikedPost(1));
      expect(state.user).toBeNull();
    });

    it("add the id when not already present, remove it when present", () => {
      let state = reducer(undefined, setNewUser(makeProfile({ likedPostIds: [] })));
      state = reducer(state, toggleLikedPost(5));
      expect(state.user?.likedPostIds).toEqual([5]);
      state = reducer(state, toggleLikedPost(5));
      expect(state.user?.likedPostIds).toEqual([]);
    });

    it("toggleLikedComment behaves the same way for likedCommentIds", () => {
      let state = reducer(undefined, setNewUser(makeProfile({ likedCommentIds: [] })));
      state = reducer(state, toggleLikedComment(9));
      expect(state.user?.likedCommentIds).toEqual([9]);
      state = reducer(state, toggleLikedComment(9));
      expect(state.user?.likedCommentIds).toEqual([]);
    });

    it("toggleFollowing behaves the same way for followingIds", () => {
      let state = reducer(undefined, setNewUser(makeProfile({ followingIds: [] })));
      state = reducer(state, toggleFollowing(3));
      expect(state.user?.followingIds).toEqual([3]);
      state = reducer(state, toggleFollowing(3));
      expect(state.user?.followingIds).toEqual([]);
    });
  });
});

describe("authSlice extraReducers", () => {
  it("registerNewUser.pending sets loading true", () => {
    const state = reducer(undefined, { type: registerNewUser.pending.type });
    expect(state.loading).toBe(true);
  });

  it("registerNewUser.fulfilled with requiresAdminVerification stores the pending email", () => {
    const state = reducer(undefined, {
      type: registerNewUser.fulfilled.type,
      payload: { requiresAdminVerification: true, email: "admin@example.com" },
    });
    expect(state.loading).toBe(false);
    expect(state.pendingAdminVerificationEmail).toBe("admin@example.com");
  });

  it("registerNewUser.fulfilled without admin verification leaves pending email untouched", () => {
    const state = reducer(undefined, { type: registerNewUser.fulfilled.type, payload: {} });
    expect(state.pendingAdminVerificationEmail).toBeNull();
  });

  it("registerNewUser.rejected sets the error message from the payload", () => {
    const state = reducer(undefined, { type: registerNewUser.rejected.type, payload: "email taken" });
    expect(state.loading).toBe(false);
    expect(state.error).toBe(true);
    expect(state.errorMsg).toBe("email taken");
  });

  it("login.fulfilled with requiresAdminVerification pauses without setting a session", () => {
    const state = reducer(undefined, {
      type: login.fulfilled.type,
      payload: { requiresAdminVerification: true, email: "admin@example.com" },
    });
    expect(state.pendingAdminVerificationEmail).toBe("admin@example.com");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("login.fulfilled with a normal account establishes the session and clears any pending verification", () => {
    const user = makeProfile();
    const state = reducer(undefined, {
      type: login.fulfilled.type,
      payload: { accessToken: "tok-789", account: user },
    });
    expect(state.accessToken).toBe("tok-789");
    expect(state.user).toBe(user);
    expect(state.pendingAdminVerificationEmail).toBeNull();
  });

  it("login.rejected records the error", () => {
    const state = reducer(undefined, { type: login.rejected.type, payload: "invalid credentials" });
    expect(state.error).toBe(true);
    expect(state.errorMsg).toBe("invalid credentials");
  });

  it("verifyAdminLoginCode.fulfilled establishes the session and clears pending verification", () => {
    const user = makeProfile();
    const state = reducer(undefined, {
      type: verifyAdminLoginCode.fulfilled.type,
      payload: { accessToken: "tok-admin", account: user },
    });
    expect(state.accessToken).toBe("tok-admin");
    expect(state.user).toBe(user);
    expect(state.pendingAdminVerificationEmail).toBeNull();
  });

  it("loginWithRefreshToken.fulfilled establishes the session", () => {
    const user = makeProfile();
    const state = reducer(undefined, {
      type: loginWithRefreshToken.fulfilled.type,
      payload: { accessToken: "tok-refresh", account: user },
    });
    expect(state.accessToken).toBe("tok-refresh");
    expect(state.user).toBe(user);
  });

  it("logout.fulfilled clears the session", () => {
    let state = reducer(undefined, setCredentials({ newUser: makeProfile(), newAccessToken: "tok" }));
    state = reducer(state, { type: logout.fulfilled.type });
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("logout.rejected still clears the session (logout is best-effort)", () => {
    let state = reducer(undefined, setCredentials({ newUser: makeProfile(), newAccessToken: "tok" }));
    state = reducer(state, { type: logout.rejected.type });
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
