import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import SearchBar from "./SearchBar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function renderSearchBar(props: Partial<React.ComponentProps<typeof SearchBar>> = {}) {
  return render(
    <MemoryRouter>
      <SearchBar toggleSearchBar={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

function typeQuery(value: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value } });
}

beforeEach(() => {
  plainMock.reset();
  // The two live-search effects (users, catalog) always fire past 2 chars —
  // keep them quiet by default so tests can focus on local search/history.
  plainMock.onGet("/accounts/any/search").reply(200, []);
  plainMock.onGet("/catalog/any/knives").reply(200, []);
  plainMock.onGet("/catalog/any/makers").reply(200, []);
  mockNavigate.mockReset();
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SearchBar — local search (pages & tricks)", () => {
  it("shows matching site pages after the debounce", async () => {
    renderSearchBar();
    typeQuery("community");
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText("Community")).toBeInTheDocument();
  });

  it("shows matching tricks after the debounce", async () => {
    renderSearchBar();
    typeQuery("rollout");
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText("Double Rollout")).toBeInTheDocument();
  });

  it("shows the no-results state for a query that matches nothing", async () => {
    renderSearchBar();
    typeQuery("zzzznotarealquery");
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByText("No quick results")).toBeInTheDocument();
  });

  it("does not open the dropdown for a 1-character query", async () => {
    renderSearchBar();
    typeQuery("c");
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByText("Community")).not.toBeInTheDocument();
  });
});

describe("SearchBar — submitting", () => {
  it("Enter navigates to the search results page and saves history", async () => {
    renderSearchBar();
    const input = screen.getByRole("textbox");
    typeQuery("benchmade");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockNavigate).toHaveBeenCalledWith("/search?q=benchmade");
    expect(JSON.parse(localStorage.getItem("search_history")!)).toEqual(["benchmade"]);
  });

  it("does not navigate or save history for an empty query", () => {
    renderSearchBar();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorage.getItem("search_history")).toBeNull();
  });

  it("clears the input after a successful search", async () => {
    renderSearchBar();
    const input = screen.getByRole("textbox") as HTMLInputElement;
    typeQuery("benchmade");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("");
  });
});

describe("SearchBar — history", () => {
  it("shows recent searches on focus when the query is empty", () => {
    localStorage.setItem("search_history", JSON.stringify(["katana", "titanium"]));
    renderSearchBar();
    fireEvent.focus(screen.getByRole("textbox"));
    expect(screen.getByText("katana")).toBeInTheDocument();
    expect(screen.getByText("titanium")).toBeInTheDocument();
  });

  it("de-duplicates and caps history at 5, most-recent first", async () => {
    renderSearchBar();
    const input = screen.getByRole("textbox");
    for (const term of ["a", "b", "c", "d", "e", "f", "a"]) {
      fireEvent.change(input, { target: { value: term } });
      fireEvent.keyDown(input, { key: "Enter" });
    }
    const history = JSON.parse(localStorage.getItem("search_history")!);
    expect(history).toHaveLength(5);
    expect(history[0]).toBe("a");
  });

  it("clears all history via Clear all", () => {
    localStorage.setItem("search_history", JSON.stringify(["katana"]));
    renderSearchBar();
    fireEvent.focus(screen.getByRole("textbox"));
    fireEvent.click(screen.getByText("Clear all"));
    expect(screen.queryByText("katana")).not.toBeInTheDocument();
    expect(localStorage.getItem("search_history")).toBeNull();
  });

  it("removes a single history entry", () => {
    localStorage.setItem("search_history", JSON.stringify(["katana", "titanium"]));
    renderSearchBar();
    fireEvent.focus(screen.getByRole("textbox"));
    const katanaRow = screen.getByText("katana").closest("button")!;
    fireEvent.click(katanaRow.querySelector('button[type="button"]')!);
    expect(screen.queryByText("katana")).not.toBeInTheDocument();
    expect(screen.getByText("titanium")).toBeInTheDocument();
  });
});

describe("SearchBar — keyboard/close behavior", () => {
  it("Escape closes the dropdown", async () => {
    renderSearchBar();
    typeQuery("community");
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText("Community")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByText("Community")).not.toBeInTheDocument();
  });

  it("Escape closes the search overlay on mobile", () => {
    const toggleSearchBar = vi.fn();
    renderSearchBar({ mobile: true, toggleSearchBar });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(toggleSearchBar).toHaveBeenCalled();
  });
});

describe("SearchBar — clicking a result", () => {
  it("navigates to the page and closes the dropdown", async () => {
    renderSearchBar();
    typeQuery("community");
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    fireEvent.click(screen.getByText("Community"));
    expect(mockNavigate).toHaveBeenCalledWith("/community");
    expect(screen.queryByText("Community")).not.toBeInTheDocument();
  });
});
