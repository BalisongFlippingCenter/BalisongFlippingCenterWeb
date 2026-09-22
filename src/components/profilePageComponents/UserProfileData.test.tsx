import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import { CollectionKnife } from "../../modals/CollectionKnife";
import UserProfileData from "./UserProfileData";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderComponent(userOverrides = {}, knives: CollectionKnife[] = []) {
  const store = makeTestStore("tok", makeProfile({ displayName: "someuser", identifierCode: "1234", ...userOverrides }));
  store.dispatch(setCollection({ id: "col-1", userId: "u1", bannerImg: null, featuredKnifeId: null, collectedKnives: knives }));
  return renderWithProviders(<UserProfileData />, store as any);
}

beforeEach(() => {
  mockNavigate.mockReset();
});

describe("UserProfileData — identity", () => {
  it("navigates to display name config on click", () => {
    renderComponent({ displayName: "someuser" });
    fireEvent.click(screen.getByText("someuser"));
    expect(mockNavigate).toHaveBeenCalledWith("/configure/display_name");
  });
});

describe("UserProfileData — bio", () => {
  it("shows a placeholder when there is no bio", () => {
    renderComponent({ profileCaption: null });
    expect(screen.getByText("Add a bio...")).toBeInTheDocument();
  });

  it("renders bold/italic/hashtag markdown-lite in the bio", () => {
    renderComponent({ profileCaption: "**bold** and *italic* and #tag" });
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("#tag")).toHaveClass("text-blue-primary");
  });

  it("navigates to bio config when clicked", () => {
    renderComponent({ profileCaption: "hello" });
    fireEvent.click(screen.getByText("hello"));
    expect(mockNavigate).toHaveBeenCalledWith("/configure/profile_caption");
  });
});

describe("UserProfileData — links panel", () => {
  it("hides social icons until the link trigger is clicked", () => {
    renderComponent({ facebookLink: "https://facebook.com/me" });
    expect(document.querySelector(".fa-square-facebook")).toBeNull();
  });

  it("shows social icons after clicking the trigger", async () => {
    renderComponent({ facebookLink: "https://facebook.com/me" });
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons.find((b) => b.querySelector(".fa-link"))!);
    // AnimatePresence/motion children mount on a subsequent tick.
    await waitFor(() => expect(document.querySelector(".fa-square-facebook")).not.toBeNull());
  });

  it("navigates to a link's configure route when clicked", async () => {
    renderComponent({ facebookLink: "https://facebook.com/me" });
    fireEvent.click(screen.getAllByRole("button").find((b) => b.querySelector(".fa-link"))!);
    await waitFor(() => expect(document.querySelector(".fa-square-facebook")).not.toBeNull());
    fireEvent.click(document.querySelector(".fa-square-facebook")!.closest("button")!);
    expect(mockNavigate).toHaveBeenCalledWith("/configure/facebook_link");
  });
});

describe("UserProfileData — stats", () => {
  it("shows post/follower/following counts", () => {
    renderComponent({ postCount: 5, followerCount: 10, followingCount: 3 });
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("defaults missing stats to 0", () => {
    // One knife in the collection so the "0" count there doesn't get counted too.
    renderComponent(
      { postCount: undefined, followerCount: undefined, followingCount: undefined },
      [{ id: "1" } as unknown as CollectionKnife],
    );
    expect(screen.getAllByText("0")).toHaveLength(3);
  });
});

describe("UserProfileData — collection card", () => {
  it("shows the knife count and navigates to the collection page", () => {
    renderComponent({}, [{ id: "1" } as unknown as CollectionKnife, { id: "2" } as unknown as CollectionKnife]);
    expect(screen.getByText("2")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Collection"));
    expect(mockNavigate).toHaveBeenCalledWith("/someuser/1234/collection");
  });
});
