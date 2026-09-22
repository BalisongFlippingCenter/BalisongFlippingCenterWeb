import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { setUnreadCount } from "../../redux/notifications/notificationSlice";
import HeaderProfileDisplay from "./HeaderProfileDisplay";

vi.mock("../NotificationPanel", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="notif-panel-stub" /> : null),
}));
vi.mock("../ProfileImageDisplay", () => ({
  default: () => <div data-testid="profile-image-stub" />,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 800 });
}

function renderHeader(userOverrides = {}) {
  const store = makeTestStore("tok", makeProfile({ displayName: "Someone", identifierCode: "1234", ...userOverrides }));
  return renderWithProviders(<HeaderProfileDisplay />, store as any);
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
  setWindowWidth(1200);
});

describe("HeaderProfileDisplay — unread badge", () => {
  it("hides the badge when there are no unread notifications", () => {
    renderHeader();
    expect(document.querySelector(".bg-red")).toBeNull();
  });

  it("shows the unread count", () => {
    const { store } = renderHeader();
    act(() => {
      store.dispatch(setUnreadCount(5));
    });
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("caps the displayed count at 99+", () => {
    const { store } = renderHeader();
    act(() => {
      store.dispatch(setUnreadCount(150));
    });
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});

describe("HeaderProfileDisplay — display name visibility", () => {
  it("shows the display name at wide viewport widths", () => {
    setWindowWidth(1200);
    renderHeader({ displayName: "WideUser" });
    expect(screen.getByText("WideUser")).toBeInTheDocument();
  });

  it("hides the display name at narrow viewport widths", () => {
    setWindowWidth(600);
    renderHeader({ displayName: "NarrowUser" });
    expect(screen.queryByText("NarrowUser")).not.toBeInTheDocument();
  });
});

describe("HeaderProfileDisplay — panel toggling", () => {
  it("opens the notification panel and closes it when the profile menu opens", () => {
    renderHeader();
    const [bellButton, profileButton] = screen.getAllByRole("button");
    fireEvent.click(bellButton);
    expect(screen.getByTestId("notif-panel-stub")).toBeInTheDocument();

    fireEvent.click(profileButton);
    expect(screen.queryByTestId("notif-panel-stub")).not.toBeInTheDocument();
  });

  it("closes the profile menu when clicking outside the container", async () => {
    renderHeader();
    const [, profileButton] = screen.getAllByRole("button");
    fireEvent.click(profileButton);
    expect(screen.getByText("Logout")).toBeInTheDocument();

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    fireEvent.mouseDown(outside);
    // AnimatePresence keeps the dropdown mounted through its exit transition.
    await waitFor(() => expect(screen.queryByText("Logout")).not.toBeInTheDocument());
    document.body.removeChild(outside);
  });
});

describe("HeaderProfileDisplay — dropdown menu", () => {
  it("navigates to the profile page", () => {
    renderHeader({ displayName: "Someone", identifierCode: "1234" });
    fireEvent.click(screen.getAllByRole("button")[1]);
    fireEvent.click(screen.getByText("Profile"));
    expect(mockNavigate).toHaveBeenCalledWith("/Someone/1234");
  });

  it("navigates to settings", () => {
    renderHeader();
    fireEvent.click(screen.getAllByRole("button")[1]);
    fireEvent.click(screen.getByText("Settings"));
    expect(mockNavigate).toHaveBeenCalledWith("/configure");
  });

  it("logs out and navigates to /login", async () => {
    plainMock.onPost("/auth/logout").reply(200);
    const { store } = renderHeader();
    fireEvent.click(screen.getAllByRole("button")[1]);
    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
    expect(store.getState().auth.accessToken).toBeNull();
  });
});
