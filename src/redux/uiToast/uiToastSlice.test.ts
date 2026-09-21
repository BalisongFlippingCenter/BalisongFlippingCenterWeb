import { describe, it, expect } from "vitest";
import reducer, { addUIToast, removeUIToast } from "./uiToastSlice";

describe("uiToastSlice", () => {
  it("starts with no toasts", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({ toasts: [] });
  });

  it("adds a toast with a generated id", () => {
    const state = reducer(undefined, addUIToast({ type: "success", message: "Saved" }));
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]).toMatchObject({ type: "success", message: "Saved" });
    expect(state.toasts[0].id).toBeTruthy();
  });

  it("removes a toast by id", () => {
    let state = reducer(undefined, addUIToast({ type: "error", message: "Failed" }));
    const id = state.toasts[0].id;
    state = reducer(state, removeUIToast(id));
    expect(state.toasts).toHaveLength(0);
  });

  it("leaves state unchanged when removing an unknown id", () => {
    const state = reducer(undefined, addUIToast({ type: "success", message: "Saved" }));
    const after = reducer(state, removeUIToast("not-a-real-id"));
    expect(after.toasts).toHaveLength(1);
  });
});
