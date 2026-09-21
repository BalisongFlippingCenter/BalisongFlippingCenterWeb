import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance, axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import ProfilePageDisplay from "./ProfilePageDisplay";

vi.mock("../PublicProfilePostsComponent", () => ({
  default: ({ accountId }: any) => <div>posts:{accountId}</div>,
}));
vi.mock("../ReportModal", () => ({
  default: ({ isOpen }: any) => (isOpen ? <div>report-modal</div> : null),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);
const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeData(overrides: Partial<any> = {}) {
  return {
    id: "2",
    displayName: "otheruser",
    identifierCode: "5678",
    profileImg: null,
    bannerImg: null,
    bio: null,
    postCount: 0,
    followerCount: 0,
    followingCount: 0,
    ...overrides,
  };
}

function renderPage(userOverrides: any = { id: "1", followingIds: [] }, token: string | null = "tok") {
  const store = makeTestStore(token, userOverrides ? makeProfile(userOverrides) : null);
  setStore(store as any);
  return renderWithProviders(
    <ProfilePageDisplay displayName="otheruser" identifierCode="5678" />,
    store as any,
  );
}

beforeEach(() => {
  plainMock.reset();
  authMock.reset();
  mockNavigate.mockReset();
});

describe("ProfilePageDisplay — loading/error", () => {
  it("shows an error state and Go back when the fetch fails", async () => {
    plainMock.onGet("/accounts/any").reply(500);
    renderPage();
    await screen.findByText("Profile not found");
    fireEvent.click(screen.getByText("Go back"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

describe("ProfilePageDisplay — profile info", () => {
  it("renders display name, identifier, and stats", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ postCount: 5, followerCount: 10, followingCount: 3 }));
    renderPage();
    await screen.findByText("otheruser");
    expect(screen.getByText("#5678")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("maps the backend bio field to the profile caption", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ bio: "hello there" }));
    renderPage();
    await screen.findByText("hello there");
  });

  it("renders the posts grid for the fetched account id", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ id: "2" }));
    renderPage();
    await screen.findByText("posts:2");
  });
});

describe("ProfilePageDisplay — follow/unfollow", () => {
  it("hides follow/message/report actions when viewing your own profile", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ id: "1" }));
    renderPage({ id: "1", followingIds: [] });
    await screen.findByText("otheruser");
    expect(screen.queryByText("Follow")).not.toBeInTheDocument();
    expect(screen.queryByText("Message")).not.toBeInTheDocument();
  });

  it("hides follow/message/report actions when logged out", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ id: "2" }));
    renderPage(null, null);
    await screen.findByText("otheruser");
    expect(screen.queryByText("Follow")).not.toBeInTheDocument();
  });

  it("shows Follow for a viewer not already following, and follows on click", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ id: "2", followerCount: 4 }));
    authMock.onPost("/accounts/any/2/follow").reply(200);
    renderPage({ id: "1", followingIds: [] });
    await screen.findByRole("button", { name: "Follow" });

    fireEvent.click(screen.getByRole("button", { name: "Follow" }));

    await screen.findByRole("button", { name: "Following" });
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows Following for a viewer already following, and unfollows on click", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ id: "2", followerCount: 4 }));
    authMock.onDelete("/accounts/any/2/follow").reply(200);
    renderPage({ id: "1", followingIds: [2] });
    await screen.findByRole("button", { name: "Following" });

    fireEvent.click(screen.getByRole("button", { name: "Following" }));

    await screen.findByRole("button", { name: "Follow" });
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("navigates to messages with the recipient prefilled", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ id: "2" }));
    renderPage({ id: "1", followingIds: [] });
    await screen.findByText("Message");
    fireEvent.click(screen.getByText("Message"));
    expect(mockNavigate).toHaveBeenCalledWith("/messages", {
      state: {
        recipient: { id: "2", displayName: "otheruser", identifierCode: "5678", profileImg: null },
      },
    });
  });

  it("opens the report modal", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ id: "2" }));
    renderPage({ id: "1", followingIds: [] });
    await screen.findByText("otheruser");
    fireEvent.click(screen.getByTitle("Report profile"));
    expect(screen.getByText("report-modal")).toBeInTheDocument();
  });
});

describe("ProfilePageDisplay — links panel", () => {
  it("hides the link trigger when there are no links set", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData());
    renderPage();
    await screen.findByText("otheruser");
    expect(document.querySelector(".fa-link")).toBeNull();
  });

  it("shows social icons after clicking the link trigger", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData({ facebookLink: "https://facebook.com/me" }));
    renderPage();
    await screen.findByText("otheruser");
    const trigger = document.querySelector(".fa-link")!.closest("button")!;
    fireEvent.click(trigger);
    await waitFor(() => expect(document.querySelector(".fa-square-facebook")).not.toBeNull());
  });
});

describe("ProfilePageDisplay — collection card", () => {
  it("navigates to the profile owner's collection", async () => {
    plainMock.onGet("/accounts/any").reply(200, makeData());
    renderPage();
    await screen.findByText("otheruser");
    fireEvent.click(screen.getByText("View Knives"));
    expect(mockNavigate).toHaveBeenCalledWith("/otheruser/5678/collection");
  });
});
