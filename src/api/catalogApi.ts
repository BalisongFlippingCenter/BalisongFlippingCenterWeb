import { axiosApiInstance } from "./axios";

export interface KnifeSummary {
  slug: string;
  name: string;
  makerName: string;
  makerSlug: string;
  bladeStyleSummary: string;
  handleMaterialSummary: string;
  priceRangeSummary: string | null;
  coverPhotoUrl: string | null;
  hasActiveVersion: boolean;
}

export interface KnifeVariant {
  variantSlug: string;
  type: "TRAINER" | "LIVE_BLADE";
  label: string;
  msrp: number | null;
  bladeStyle: string | null;
  bladeMaterial: string | null;
  imageUrl: string | null;
}

export interface WhereToFind {
  label: string;
  url: string | null;
  type: string;
  note: string | null;
}

export interface KnifeVersion {
  versionSlug: string;
  versionLabel: string;
  discontinued: boolean;
  releaseYear: number | null;
  description: string | null;
  overallLength: number | null;
  weight: number | null;
  pivotSystem: string | null;
  latchType: string | null;
  pinSystem: string | null;
  hasModularBalance: boolean;
  balanceValue: string | null;
  handleConstruction: string | null;
  handleMaterial: string | null;
  handleFinish: string | null;
  variants: KnifeVariant[];
  whereToFind: WhereToFind[];
}

export interface KnifeDetail {
  slug: string;
  name: string;
  makerName: string;
  makerSlug: string;
  bladeStyleSummary: string;
  priceRangeSummary: string | null;
  coverPhotoUrl: string | null;
  description: string | null;
  versions: KnifeVersion[];
}

export interface MakerSummary {
  slug: string;
  name: string;
  country: string | null;
  logoUrl: string | null;
}

export interface MakerDetail {
  slug: string;
  name: string;
  country: string | null;
  knownFor: string | null;
  officialSiteUrl: string | null;
  logoUrl: string | null;
  foundedYear: number | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  knives: KnifeSummary[];
}

export const searchKnivesCatalog = (search?: string) =>
  axiosApiInstance
    .get<KnifeSummary[]>("/catalog/any/knives", { params: search ? { search } : {} })
    .then((res) => res.data);

export const getKnifeCatalogDetail = (slug: string) =>
  axiosApiInstance.get<KnifeDetail>(`/catalog/any/knives/${slug}`).then((res) => res.data);

export const listMakersCatalog = () =>
  axiosApiInstance.get<MakerSummary[]>("/catalog/any/makers").then((res) => res.data);

export const getMakerCatalogDetail = (slug: string) =>
  axiosApiInstance.get<MakerDetail>(`/catalog/any/makers/${slug}`).then((res) => res.data);
