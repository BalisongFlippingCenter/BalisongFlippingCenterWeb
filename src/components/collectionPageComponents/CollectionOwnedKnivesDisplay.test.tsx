import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import { CollectionKnife } from "../../modals/CollectionKnife";
import CollectionOwnedKnivesDisplay from "./CollectionOwnedKnivesDisplay";

vi.mock("./OwnedKnifeCard", () => ({
  default: ({ knife, isFeatured }: any) => <div>card:{knife.id}:{isFeatured ? "featured" : "normal"}</div>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeKnife(overrides: Partial<CollectionKnife> = {}): CollectionKnife {
  return {
    id: "1",
    displayName: "Knife",
    knifeMaker: "Maker",
    baseKnifeModel: "Model",
    coverPhoto: "",
    averageScore: null,
    knifeType: "liveblade",
    ...overrides,
  } as unknown as CollectionKnife;
}

function renderDisplay(knives: CollectionKnife[], featuredKnifeId: string | null = null) {
  const store = makeTestStore("tok", makeProfile({ displayName: "someuser", identifierCode: "1234" }));
  store.dispatch(
    setCollection({ id: "col-1", userId: "u1", bannerImg: null, featuredKnifeId, collectedKnives: knives }),
  );
  return renderWithProviders(<CollectionOwnedKnivesDisplay />, store as any);
}

beforeEach(() => {
  mockNavigate.mockReset();
});

describe("CollectionOwnedKnivesDisplay — featured spotlight", () => {
  it("hides the spotlight when there is no featured knife", () => {
    renderDisplay([makeKnife({ id: "1" })], null);
    expect(screen.queryByText("Featured Knife")).not.toBeInTheDocument();
  });

  it("shows the spotlight for the featured knife", () => {
    renderDisplay([makeKnife({ id: "1", displayName: "Special" }), makeKnife({ id: "2" })], "1");
    expect(screen.getByText("Featured Knife")).toBeInTheDocument();
    expect(screen.getByText("Special")).toBeInTheDocument();
  });

  it("navigates to the featured knife's page on click", () => {
    renderDisplay([makeKnife({ id: "1", displayName: "Special" })], "1");
    fireEvent.click(screen.getByText("Special"));
    expect(mockNavigate).toHaveBeenCalledWith("/someuser/1234/collection/Special");
  });

  it("maps knifeType to a human label in the spotlight", () => {
    renderDisplay([makeKnife({ id: "1", knifeType: "TRAINER" })], "1");
    expect(screen.getByText("Trainer")).toBeInTheDocument();
  });
});

describe("CollectionOwnedKnivesDisplay — grid ordering", () => {
  it("sorts the featured knife to the front of the grid", () => {
    renderDisplay(
      [makeKnife({ id: "1" }), makeKnife({ id: "2" }), makeKnife({ id: "3" })],
      "2",
    );
    const cards = screen.getAllByText(/^card:/).map((el) => el.textContent);
    expect(cards[0]).toBe("card:2:featured");
  });

  it("sorts remaining knives by id descending", () => {
    renderDisplay([makeKnife({ id: "1" }), makeKnife({ id: "3" }), makeKnife({ id: "2" })], null);
    const cards = screen.getAllByText(/^card:/).map((el) => el.textContent);
    expect(cards).toEqual(["card:3:normal", "card:2:normal", "card:1:normal"]);
  });
});

describe("CollectionOwnedKnivesDisplay — add knife", () => {
  it("navigates to the add-knife page", () => {
    renderDisplay([]);
    fireEvent.click(screen.getByText("Add Knife"));
    expect(mockNavigate).toHaveBeenCalledWith("/add-collection-knife");
  });
});
