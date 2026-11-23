import { KnifeSummary } from "../api/adminCatalogApi";

export type KnifeGroupEntry =
  | { kind: "family"; name: string; knives: KnifeSummary[] }
  | { kind: "knife"; name: string; knife: KnifeSummary };

export interface MakerKnifeGroup {
  makerSlug: string;
  makerName: string;
  count: number;
  entries: KnifeGroupEntry[];
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

export const groupKnivesByMakerAndFamily = (knives: KnifeSummary[]): MakerKnifeGroup[] => {
  const makers = new Map<string, MakerKnifeGroup>();
  for (const knife of knives) {
    let maker = makers.get(knife.makerSlug);
    if (!maker) {
      maker = { makerSlug: knife.makerSlug, makerName: knife.makerName, count: 0, entries: [] };
      makers.set(knife.makerSlug, maker);
    }
    maker.count++;
    const family = knife.family?.trim();
    if (!family) {
      maker.entries.push({ kind: "knife", name: knife.name, knife });
      continue;
    }
    const existing = maker.entries.find((e) => e.kind === "family" && e.name.toLowerCase() === family.toLowerCase());
    if (existing?.kind === "family") existing.knives.push(knife);
    else maker.entries.push({ kind: "family", name: family, knives: [knife] });
  }
  for (const maker of makers.values()) {
    maker.entries.sort(byName);
    for (const entry of maker.entries) if (entry.kind === "family") entry.knives.sort(byName);
  }
  return [...makers.values()].sort((a, b) => a.makerName.localeCompare(b.makerName));
};
