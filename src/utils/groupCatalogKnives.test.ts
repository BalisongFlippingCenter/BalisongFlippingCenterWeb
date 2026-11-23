import { describe, it, expect } from "vitest";
import { groupKnivesByMakerAndFamily } from "./groupCatalogKnives";
import { KnifeSummary } from "../api/adminCatalogApi";

const knife = (name: string, makerSlug: string, family: string | null = null): KnifeSummary => ({
  slug: name.toLowerCase(), name, makerName: makerSlug.toUpperCase(), makerSlug, family, coverPhotoUrl: null, hasActiveVersion: true,
});

describe("groupKnivesByMakerAndFamily", () => {
  it("sorts makers, then families and standalone knives together by name", () => {
    const groups = groupKnivesByMakerAndFamily([
      knife("Squiddy-B", "squid", "Squiddy"),
      knife("Mako", "squid"),
      knife("Hydro", "squid"),
      knife("Squiddy", "squid", "Squiddy"),
      knife("Alpha Beast", "brs"),
    ]);

    expect(groups.map((g) => [g.makerName, g.count])).toEqual([["BRS", 1], ["SQUID", 4]]);
    expect(groups[1].entries.map((e) => [e.kind, e.name])).toEqual([["knife", "Hydro"], ["knife", "Mako"], ["family", "Squiddy"]]);
    const family = groups[1].entries[2];
    expect(family.kind === "family" && family.knives.map((k) => k.name)).toEqual(["Squiddy", "Squiddy-B"]);
  });

  it("merges family names that differ only in case or surrounding spaces, and keeps blank families standalone", () => {
    const groups = groupKnivesByMakerAndFamily([
      knife("Krake Raken", "squid", "Krake Raken"),
      knife("Titanium Krake Raken", "squid", " krake raken "),
      knife("Nautilus", "squid", "   "),
    ]);

    expect(groups[0].entries.map((e) => [e.kind, e.name])).toEqual([["family", "Krake Raken"], ["knife", "Nautilus"]]);
  });

  it("does not merge same-named families across makers", () => {
    const groups = groupKnivesByMakerAndFamily([knife("A", "one", "Beast"), knife("B", "two", "Beast")]);
    expect(groups.map((g) => g.entries.length)).toEqual([1, 1]);
  });
});
