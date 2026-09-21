import { describe, it, expect } from "vitest";
import { mapCollection, mapCollectionKnife } from "./collectionActions";

describe("mapCollectionKnife", () => {
  it("falls back to legacy field names when the primary ones are absent", () => {
    const mapped = mapCollectionKnife({
      isFavoriteKnife: true,
      isFavoriteFlipper: true,
      knifeMSRP: "199.99",
    });
    expect(mapped.favoriteKnife).toBe(true);
    expect(mapped.favoriteFlipper).toBe(true);
    expect(mapped.msrp).toBe("199.99");
  });

  it("prefers the primary field name over the legacy fallback", () => {
    const mapped = mapCollectionKnife({ favoriteKnife: false, isFavoriteKnife: true, msrp: "50", knifeMSRP: "999" });
    expect(mapped.favoriteKnife).toBe(false);
    expect(mapped.msrp).toBe("50");
  });

  it("lowercases knifeType, defaulting to liveblade when absent", () => {
    expect(mapCollectionKnife({ knifeType: "TRAINER" }).knifeType).toBe("trainer");
    expect(mapCollectionKnife({}).knifeType).toBe("liveblade");
  });

  it("formats enum fields using the display-name overrides", () => {
    const mapped = mapCollectionKnife({
      pivotSystem: "LATCHLESS",
      latchType: "G_10_TITANIUM",
      bladeMaterial: "S35VN",
    });
    expect(mapped.pivotSystem).toBe("No Latch");
    expect(mapped.latchType).toBe("G-10/Titanium");
    expect(mapped.bladeMaterial).toBe("s35vn");
  });

  it("title-cases enum fields with no override", () => {
    expect(mapCollectionKnife({ bladeStyle: "DROP_POINT" }).bladeStyle).toBe("Drop Point");
  });

  it("defaults unset enum fields to Unknown", () => {
    expect(mapCollectionKnife({}).handleMaterial).toBe("Unknown");
  });

  it("rounds every score field, defaulting missing scores to 0", () => {
    const mapped = mapCollectionKnife({ qualityScore: 4.6, flippingScore: 3.2 });
    expect(mapped.qualityScore).toBe(5);
    expect(mapped.flippingScore).toBe(3);
    expect(mapped.feelScore).toBe(0);
    expect(mapped.soundScore).toBe(0);
    expect(mapped.durabilityScore).toBe(0);
  });
});

describe("mapCollection", () => {
  it("falls back to legacy field names for userId and bannerImg", () => {
    const mapped = mapCollection({ accountId: "acc-1", bannerImage: "img.png" });
    expect(mapped.userId).toBe("acc-1");
    expect(mapped.bannerImg).toBe("img.png");
  });

  it("maps each entry of collectedKnives through mapCollectionKnife", () => {
    const mapped = mapCollection({ collectedKnives: [{ displayName: "Squiddy" }] });
    expect(mapped.collectedKnives).toHaveLength(1);
    expect(mapped.collectedKnives?.[0].displayName).toBe("Squiddy");
    expect(mapped.collectedKnives?.[0].pivotSystem).toBe("Unknown");
  });

  it("sets collectedKnives to null when the field isn't an array", () => {
    expect(mapCollection({}).collectedKnives).toBeNull();
    expect(mapCollection({ collectedKnives: "not-an-array" }).collectedKnives).toBeNull();
  });
});
