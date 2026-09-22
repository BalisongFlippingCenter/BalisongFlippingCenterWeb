import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore } from "../test/testStore";
import { addUIToast } from "../redux/uiToast/uiToastSlice";
import UIToastContainer from "./UIToastContainer";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("UIToastContainer", () => {
  it("renders a toast dispatched into the store", () => {
    const store = makeTestStore();
    store.dispatch(addUIToast({ type: "success", message: "Saved!" }));
    renderWithProviders(<UIToastContainer />, store as any);
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("auto-dismisses a toast after 4 seconds", () => {
    const store = makeTestStore();
    store.dispatch(addUIToast({ type: "success", message: "Saved!" }));
    renderWithProviders(<UIToastContainer />, store as any);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(store.getState().uiToast.toasts).toHaveLength(0);
  });

  it("dismisses a toast immediately via its close button", () => {
    const store = makeTestStore();
    store.dispatch(addUIToast({ type: "error", message: "Failed!" }));
    renderWithProviders(<UIToastContainer />, store as any);

    fireEvent.click(screen.getByRole("button"));
    expect(store.getState().uiToast.toasts).toHaveLength(0);
  });

  it("renders multiple toasts independently", () => {
    const store = makeTestStore();
    store.dispatch(addUIToast({ type: "success", message: "First" }));
    store.dispatch(addUIToast({ type: "error", message: "Second" }));
    renderWithProviders(<UIToastContainer />, store as any);

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
