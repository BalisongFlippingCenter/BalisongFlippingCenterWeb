import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { makeTestStore, makeProfile } from "../../test/testStore";
import Header from "./Header";

vi.mock("./HeaderProfileDisplay", () => ({ default: () => <div data-testid="profile-display-stub" /> }));
vi.mock("../navigation/HeaderNavbar", () => ({ default: () => <div data-testid="desktop-navbar-stub" /> }));
vi.mock("../SearchBar", () => ({ default: () => <div data-testid="search-bar-stub" /> }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 800 });
}

function renderHeader(path = "/community", loggedIn = true) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile() : null);
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="*" element={<Header />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
}

beforeEach(() => {
  mockNavigate.mockReset();
});

describe("Header — auth state", () => {
  it("shows the profile display when logged in", () => {
    setWindowWidth(1400);
    renderHeader("/community", true);
    expect(screen.getByTestId("profile-display-stub")).toBeInTheDocument();
  });

  it("shows a Sign In button when logged out, which navigates to /login", () => {
    setWindowWidth(1400);
    renderHeader("/community", false);
    fireEvent.click(screen.getByRole("button", { name: /Sign In/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});

describe("Header — responsive nav", () => {
  it("shows the desktop navbar and hides the hamburger above the 1150 breakpoint", () => {
    setWindowWidth(1400);
    renderHeader();
    expect(screen.getByTestId("desktop-navbar-stub")).toBeInTheDocument();
  });

  it("hides the desktop navbar below the 1150 breakpoint", () => {
    setWindowWidth(800);
    renderHeader();
    expect(screen.queryByTestId("desktop-navbar-stub")).not.toBeInTheDocument();
  });
});

describe("Header — search overlay", () => {
  it("toggles the search overlay on click of the search icon", () => {
    setWindowWidth(1400);
    const { container } = renderHeader();
    expect(screen.queryByTestId("search-bar-stub")).not.toBeInTheDocument();
    fireEvent.click(container.querySelector(".fa-magnifying-glass")!);
    expect(screen.getByTestId("search-bar-stub")).toBeInTheDocument();
  });
});

describe("Header — mobile menu", () => {
  it("opens the mobile dropdown via the hamburger", () => {
    setWindowWidth(800);
    const { container } = renderHeader();
    fireEvent.click(container.querySelector(".fa-bars-staggered")!.closest("div")!);
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Tutorial Center")).toBeInTheDocument();
  });

  it("closes the mobile dropdown when a nav link is clicked", () => {
    setWindowWidth(800);
    const { container } = renderHeader();
    fireEvent.click(container.querySelector(".fa-bars-staggered")!.closest("div")!);
    fireEvent.click(screen.getByText("Community"));
    expect(screen.queryByText("Tutorial Center")).not.toBeInTheDocument();
  });

  it("highlights the active top-level link", () => {
    setWindowWidth(800);
    const { container } = renderHeader("/tutorial-center/level-1");
    fireEvent.click(container.querySelector(".fa-bars-staggered")!.closest("div")!);
    const link = screen.getByText("Tutorial Center").closest("a")!;
    expect(link).toHaveClass("border-blue-primary");
  });

  it("expands the About accordion and shows its sub-items", () => {
    setWindowWidth(800);
    const { container } = renderHeader();
    fireEvent.click(container.querySelector(".fa-bars-staggered")!.closest("div")!);
    expect(screen.queryByText("Terms of Service")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("About"));
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
  });

  it("marks About active when on one of its sub-pages", () => {
    setWindowWidth(800);
    const { container } = renderHeader("/privacy");
    fireEvent.click(container.querySelector(".fa-bars-staggered")!.closest("div")!);
    const aboutButton = screen.getByText("About").closest("button")!;
    expect(aboutButton).toHaveClass("border-blue-primary");
  });
});
