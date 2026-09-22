import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import PublicCollectionPageComponent from "./PublicCollectionPageComponent";

vi.mock("./OwnedKnifeCard", () => ({
  default: ({ knife, isFeatured }: any) => <div>card:{knife.id}:{isFeatured ? "featured" : "normal"}</div>,
}));
vi.mock("./CollectionPost", () => ({ default: ({ post }: any) => <div>post:{post.id}</div> }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function makeKnife(overrides: Partial<any> = {}) {
  return { id: "1", displayName: "Knife", knifeMaker: "Maker", baseKnifeModel: "M", coverPhoto: "", averageScore: null, msrp: "100", ...overrides };
}

function makeData(overrides: Partial<any> = {}) {
  return {
    accountId: "acc-1",
    displayName: "otheruser",
    identifierCode: "5678",
    profileImg: null,
    collection: { id: "col-1", bannerImage: null, featuredKnifeId: null, collectedKnives: [], ...overrides.collection },
    ...overrides,
  };
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("PublicCollectionPageComponent — loading/error", () => {
  it("shows an error state and Go back when the fetch fails", async () => {
    plainMock.onGet("/collection/any/handle").reply(500);
    renderWithProviders(<PublicCollectionPageComponent displayName="otheruser" identifierCode="5678" />);
    await screen.findByText("Collection not found");
    fireEvent.click(screen.getByText("Go back"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

describe("PublicCollectionPageComponent — stats", () => {
  it("shows knife count, formatted total value, and avg score", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, makeData({
      collection: { id: "col-1", collectedKnives: [makeKnife({ id: "1", msrp: "100", averageScore: 8 }), makeKnife({ id: "2", msrp: "50", averageScore: 6 })] },
    }));
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, []);
    renderWithProviders(<PublicCollectionPageComponent displayName="otheruser" identifierCode="5678" />);

    await screen.findByText("2");
    expect(screen.getByText("$150")).toBeInTheDocument();
    expect(screen.getByText("7.0")).toBeInTheDocument();
  });

  it("shows dashes for an empty collection", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, makeData());
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, []);
    renderWithProviders(<PublicCollectionPageComponent displayName="otheruser" identifierCode="5678" />);
    await screen.findByText("No knives yet.");
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});

describe("PublicCollectionPageComponent — featured knife and ordering", () => {
  it("shows the spotlight and sorts the featured knife first", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, makeData({
      collection: {
        id: "col-1",
        featuredKnifeId: "2",
        collectedKnives: [makeKnife({ id: "1" }), makeKnife({ id: "2", displayName: "Spotlight Knife" }), makeKnife({ id: "3" })],
      },
    }));
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, []);
    renderWithProviders(<PublicCollectionPageComponent displayName="otheruser" identifierCode="5678" />);

    await screen.findByText("Featured Knife");
    expect(screen.getByText("Spotlight Knife")).toBeInTheDocument();
    const cards = screen.getAllByText(/^card:/).map((el) => el.textContent);
    expect(cards[0]).toBe("card:2:featured");
  });

  it("navigates to the featured knife using the profile owner (not the viewer)", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, makeData({
      collection: { id: "col-1", featuredKnifeId: "1", collectedKnives: [makeKnife({ id: "1", displayName: "Spotlight" })] },
    }));
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, []);
    renderWithProviders(<PublicCollectionPageComponent displayName="otheruser" identifierCode="5678" />);

    await screen.findByText("Spotlight");
    fireEvent.click(screen.getByText("Spotlight"));
    expect(mockNavigate).toHaveBeenCalledWith("/otheruser/5678/collection/Spotlight");
  });
});

describe("PublicCollectionPageComponent — activity sidebar", () => {
  it("fetches and shows activity posts once the collection id is known", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, makeData({ collection: { id: "col-1", collectedKnives: [] } }));
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, [{ id: "p1" }]);
    renderWithProviders(<PublicCollectionPageComponent displayName="otheruser" identifierCode="5678" />);
    await screen.findByText("post:p1");
  });

  it("shows the empty-activity state when there are no posts", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, makeData({ collection: { id: "col-1", collectedKnives: [] } }));
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, []);
    renderWithProviders(<PublicCollectionPageComponent displayName="otheruser" identifierCode="5678" />);
    await screen.findByText("No activity yet.");
  });
});

describe("PublicCollectionPageComponent — header", () => {
  it("navigates to the owner's profile on click", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, makeData());
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, []);
    renderWithProviders(<PublicCollectionPageComponent displayName="otheruser" identifierCode="5678" />);
    await screen.findByText("otheruser");
    fireEvent.click(screen.getByText("otheruser"));
    expect(mockNavigate).toHaveBeenCalledWith("/otheruser/5678");
  });
});
