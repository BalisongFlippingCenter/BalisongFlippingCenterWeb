import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SuccessfulEmailVerificationComponent from "./SuccessfulEmailVerificationComponent";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockNavigate.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SuccessfulEmailVerificationComponent", () => {
  it("navigates to /login when the button is clicked", () => {
    render(
      <MemoryRouter>
        <SuccessfulEmailVerificationComponent />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "To Login" }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("automatically navigates to /login after the 30-second timeout", () => {
    render(
      <MemoryRouter>
        <SuccessfulEmailVerificationComponent />
      </MemoryRouter>,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("navigates to /login on unmount even before the timeout elapses", () => {
    const { unmount } = render(
      <MemoryRouter>
        <SuccessfulEmailVerificationComponent />
      </MemoryRouter>,
    );
    act(() => {
      unmount();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
