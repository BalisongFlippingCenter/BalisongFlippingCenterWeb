import { Collection } from "../../modals/Collection";
import { CollectionKnife } from "../../modals/CollectionKnife";

// Maps backend Collection DTO field names → frontend Collection field names
export const mapCollection = (data: any): Collection => ({
  id:              data.id              ?? null,
  userId:          data.userId          ?? data.accountId  ?? null,
  bannerImg:       data.bannerImg       ?? data.bannerImage ?? null,
  featuredKnifeId: data.featuredKnifeId ?? null,
  collectedKnives: data.collectedKnives ?? null,
});

// Maps backend CollectionKnife response → frontend CollectionKnife shape
// Handles field name mismatches (isFavoriteKnife ↔ favoriteKnife, knifeMSRP ↔ msrp, etc.)
export const mapCollectionKnife = (data: any): CollectionKnife => ({
  id:                  data.id                ?? null,
  collectionId:        data.collectionId      ?? null,
  displayName:         data.displayName       ?? "",
  knifeMaker:          data.knifeMaker        ?? "",
  baseKnifeModel:      data.baseKnifeModel    ?? "",
  knifeType:           data.knifeType         ?? "liveblade",
  favoriteKnife:       data.favoriteKnife     ?? data.isFavoriteKnife  ?? false,
  favoriteFlipper:     data.favoriteFlipper   ?? data.isFavoriteFlipper ?? false,
  aqquiredDate:        data.aqquiredDate      ?? "",
  coverPhoto:          data.coverPhoto        ?? "",
  msrp:                data.msrp              ?? data.knifeMSRP        ?? "",
  overallLength:       data.overallLength     ?? "",
  weight:              data.weight            ?? "",
  pivotSystem:         data.pivotSystem       ?? "Unknown",
  latchType:           data.latchType         ?? "Unknown",
  pinSystem:           data.pinSystem         ?? "Unknown",
  hasModularBalance:   data.hasModularBalance ?? false,
  balanceValue:        data.balanceValue      ?? null,
  bladeStyle:          data.bladeStyle        ?? "Unknown",
  bladeFinish:         data.bladeFinish       ?? "Unknown",
  bladeMaterial:       data.bladeMaterial     ?? "Unknown",
  handleConstruction:  data.handleConstruction ?? "Unknown",
  handleMaterial:      data.handleMaterial    ?? "Unknown",
  handleFinish:        data.handleFinish      ?? "Unknown",
  galleryFiles:        data.galleryFiles      ?? null,
  averageScore:        data.averageScore      ?? null,
  qualityScore:        data.qualityScore      ?? 5,
  flippingScore:       data.flippingScore     ?? 5,
  feelScore:           data.feelScore         ?? 5,
  soundScore:          data.soundScore        ?? 5,
  durabilityScore:     data.durabilityScore   ?? 5,
});
