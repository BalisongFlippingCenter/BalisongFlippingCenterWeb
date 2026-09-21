import { describe, it, expect, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useWindowSize from "./useWindowSize";

function setWindowDimensions(height: number, width: number) {
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
}

afterEach(() => {
  setWindowDimensions(768, 1024);
});

describe("useWindowSize", () => {
  it("returns the current window dimensions on mount", () => {
    setWindowDimensions(600, 800);
    const { result } = renderHook(() => useWindowSize());
    expect(result.current).toEqual([600, 800]);
  });

  it("updates when the window is resized", () => {
    setWindowDimensions(600, 800);
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      setWindowDimensions(400, 900);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toEqual([400, 900]);
  });

  it("removes the resize listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useWindowSize());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    removeSpy.mockRestore();
  });
});
