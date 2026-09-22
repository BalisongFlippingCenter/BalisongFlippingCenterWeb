import { describe, it, expect } from "vitest";
import reducer, {
  clearCollection,
  setCollection,
  updateCollectionKnife,
  removeCollectionKnife,
} from "./collectionSlice";
import { Collection } from "../../modals/Collection";
import { CollectionKnife } from "../../modals/CollectionKnife";

function makeKnife(overrides: Partial<CollectionKnife> = {}): CollectionKnife {
  return {
    id: "1",
    displayName: "Test Knife",
    ...overrides,
  } as unknown as CollectionKnife;
}

function makeCollection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: "col-1",
    userId: "user-1",
    bannerImg: null,
    featuredKnifeId: null,
    collectedKnives: [],
    ...overrides,
  };
}

describe("collectionSlice", () => {
  it("setCollection stores the collection and derives collectionKnives from it", () => {
    const knife = makeKnife({ id: "5" });
    const state = reducer(undefined, setCollection(makeCollection({ collectedKnives: [knife] })));
    expect(state.collection?.id).toBe("col-1");
    expect(state.collectionKnives).toEqual([knife]);
  });

  it("clearCollection resets both fields", () => {
    let state = reducer(undefined, setCollection(makeCollection({ collectedKnives: [makeKnife()] })));
    state = reducer(state, clearCollection());
    expect(state.collection).toBeNull();
    expect(state.collectionKnives).toEqual([]);
  });

  it("updateCollectionKnife replaces the matching knife in both lists, matched by string id", () => {
    const original = makeKnife({ id: "5", displayName: "Old Name" });
    let state = reducer(undefined, setCollection(makeCollection({ collectedKnives: [original] })));
    const updated = makeKnife({ id: "5", displayName: "New Name" });
    state = reducer(state, updateCollectionKnife(updated));
    expect(state.collectionKnives[0].displayName).toBe("New Name");
    expect(state.collection?.collectedKnives?.[0].displayName).toBe("New Name");
  });

  it("updateCollectionKnife leaves other knives untouched", () => {
    const a = makeKnife({ id: "1", displayName: "A" });
    const b = makeKnife({ id: "2", displayName: "B" });
    let state = reducer(undefined, setCollection(makeCollection({ collectedKnives: [a, b] })));
    state = reducer(state, updateCollectionKnife(makeKnife({ id: "1", displayName: "A-edited" })));
    expect(state.collectionKnives.map((k) => k.displayName)).toEqual(["A-edited", "B"]);
  });

  it("removeCollectionKnife filters the knife out of both lists", () => {
    const knife = makeKnife({ id: "5" });
    let state = reducer(undefined, setCollection(makeCollection({ collectedKnives: [knife] })));
    state = reducer(state, removeCollectionKnife("5"));
    expect(state.collectionKnives).toEqual([]);
    expect(state.collection?.collectedKnives).toEqual([]);
  });

  it("removeCollectionKnife clears featuredKnifeId when the removed knife was featured", () => {
    const knife = makeKnife({ id: "5" });
    let state = reducer(
      undefined,
      setCollection(makeCollection({ collectedKnives: [knife], featuredKnifeId: "5" })),
    );
    state = reducer(state, removeCollectionKnife("5"));
    expect(state.collection?.featuredKnifeId).toBeNull();
  });

  it("removeCollectionKnife leaves featuredKnifeId alone when a different knife was removed", () => {
    const featured = makeKnife({ id: "5" });
    const other = makeKnife({ id: "6" });
    let state = reducer(
      undefined,
      setCollection(makeCollection({ collectedKnives: [featured, other], featuredKnifeId: "5" })),
    );
    state = reducer(state, removeCollectionKnife("6"));
    expect(state.collection?.featuredKnifeId).toBe("5");
  });
});
