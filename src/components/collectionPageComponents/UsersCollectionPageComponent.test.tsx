import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import { CollectionKnife } from "../../modals/CollectionKnife";
import UsersCollectionPageComponent from "./UsersCollectionPageComponent";

vi.mock("./CollectionOwnedKnivesDisplay", () => ({ default: () => <div /> }));
vi.mock("./CollectionPostsDisplay", () => ({ default: () => <div /> }));

function makeKnife(overrides: Partial<CollectionKnife> = {}): CollectionKnife {
  return { id: "1", msrp: "100", averageScore: null, ...overrides } as unknown as CollectionKnife;
}

function renderPage(knives: CollectionKnife[], userOverrides = {}) {
  const store = makeTestStore("tok", makeProfile({ displayName: "someuser", identifierCode: "1234", ...userOverrides }));
  store.dispatch(setCollection({ id: "col-1", userId: "u1", bannerImg: null, featuredKnifeId: null, collectedKnives: knives }));
  return renderWithProviders(<UsersCollectionPageComponent />, store as any);
}

describe("UsersCollectionPageComponent — stats", () => {
  it("shows the knife count", () => {
    renderPage([makeKnife({ id: "1" }), makeKnife({ id: "2" })]);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows a dash for an empty collection's value and score", () => {
    renderPage([]);
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("sums parsed MSRP values, ignoring blank/non-numeric ones", () => {
    renderPage([
      makeKnife({ id: "1", msrp: "100" }),
      makeKnife({ id: "2", msrp: "$50.50" }),
      makeKnife({ id: "3", msrp: "" }),
      makeKnife({ id: "4", msrp: "n/a" as any }),
    ]);
    expect(screen.getByText("$150.50")).toBeInTheDocument();
  });

  it("formats the total value in the viewer's currency", () => {
    renderPage([makeKnife({ id: "1", msrp: "100" })], { currency: "EUR" });
    expect(screen.getByText("€92.00")).toBeInTheDocument();
  });

  it("averages only knives that have a score", () => {
    renderPage([
      makeKnife({ id: "1", averageScore: 8 }),
      makeKnife({ id: "2", averageScore: 6 }),
      makeKnife({ id: "3", averageScore: null }),
    ]);
    expect(screen.getByText("7.0")).toBeInTheDocument();
  });
});
