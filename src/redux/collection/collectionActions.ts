import { Collection } from "../../modals/Collection";
import { CollectionKnife } from "../../modals/CollectionKnife";

// Enum values that don't title-case cleanly from their backend key
const ENUM_DISPLAY: Record<string, string> = {
  LATCHLESS:       "No Latch",
  ZIR_BLASTED:     "Zirblasted",
  DLC:             "DLC",
  S32VN:           "s32vn",
  S35VN:           "s35vn",
  D2:              "D2",
  G_10:            "G-10",
  G_10_TITANIUM:   "G-10/Titanium",
  G_10_ALUMINIUM:  "G-10/Aluminium",
};

const formatEnum = (value: string | null | undefined, fallback = "Unknown"): string => {
  if (!value) return fallback;
  if (ENUM_DISPLAY[value]) return ENUM_DISPLAY[value];
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

// Maps backend Collection DTO field names → frontend Collection field names
export const mapCollection = (data: any): Collection => ({
  id:              data.id              ?? null,
  userId:          data.userId          ?? data.accountId  ?? null,
  bannerImg:       data.bannerImg       ?? data.bannerImage ?? null,
  featuredKnifeId: data.featuredKnifeId ?? null,
  collectedKnives: Array.isArray(data.collectedKnives)
    ? data.collectedKnives.map(mapCollectionKnife)
    : null,
});

// Maps backend CollectionKnife response → frontend CollectionKnife shape
// Handles field name mismatches (isFavoriteKnife ↔ favoriteKnife, knifeMSRP ↔ msrp, etc.)
export const mapCollectionKnife = (data: any): CollectionKnife => ({
  id:                  data.id                ?? null,
  collectionId:        data.collectionId      ?? null,
  displayName:         data.displayName       ?? "",
  knifeMaker:          data.knifeMaker        ?? "",
  baseKnifeModel:      data.baseKnifeModel    ?? "",
  knifeType:           data.knifeType?.toLowerCase() ?? "liveblade",
  favoriteKnife:       data.favoriteKnife     ?? data.isFavoriteKnife   ?? false,
  favoriteFlipper:     data.favoriteFlipper   ?? data.isFavoriteFlipper ?? false,
  aqquiredDate:        data.aqquiredDate      ?? "",
  coverPhoto:          data.coverPhoto        ?? "",
  msrp:                data.msrp              ?? data.knifeMSRP         ?? "",
  overallLength:       data.overallLength     ?? "",
  weight:              data.weight            ?? "",
  pivotSystem:         formatEnum(data.pivotSystem),
  latchType:           formatEnum(data.latchType),
  pinSystem:           formatEnum(data.pinSystem),
  hasModularBalance:   data.hasModularBalance ?? false,
  balanceValue:        data.balanceValue      ?? null,
  bladeStyle:          formatEnum(data.bladeStyle),
  bladeFinish:         formatEnum(data.bladeFinish),
  bladeMaterial:       formatEnum(data.bladeMaterial),
  handleConstruction:  formatEnum(data.handleConstruction),
  handleMaterial:      formatEnum(data.handleMaterial),
  handleFinish:        formatEnum(data.handleFinish),
  galleryFiles:        data.galleryFiles      ?? null,
  averageScore:        data.averageScore      ?? null,
  qualityScore:        Math.round(data.qualityScore    ?? 0),
  flippingScore:       Math.round(data.flippingScore   ?? 0),
  feelScore:           Math.round(data.feelScore       ?? 0),
  soundScore:          Math.round(data.soundScore      ?? 0),
  durabilityScore:     Math.round(data.durabilityScore ?? 0),
});
