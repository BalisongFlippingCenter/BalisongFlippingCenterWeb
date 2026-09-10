import { axiosApiInstanceAuth } from "./axios";

export interface MakerSummary {
  slug: string;
  name: string;
  country: string | null;
  logoUrl: string | null;
}

export interface MakerFormData {
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
}

export interface CatalogImportPayload {
  makers?: unknown[];
  knives?: unknown[];
}

export interface KnifeSummary {
  slug: string;
  name: string;
  makerName: string;
  makerSlug: string;
  hasActiveVersion: boolean;
}

export interface WhereToFindFormData {
  label: string;
  url: string;
  type: string;
  note: string;
}

export interface VariantFormData {
  variantSlug: string;
  type: string;
  label: string;
  msrp: string;
  bladeStyle: string;
  bladeMaterial: string;
  bladeFinish: string;
}

export interface VersionFormData {
  versionSlug: string;
  version: string;
  discontinued: boolean;
  releaseYear: number | null;
  description: string;
  overallLength: string;
  weight: string;
  pivotSystem: string;
  latchType: string;
  pinSystem: string;
  hasModularBalance: boolean;
  balanceValue: string;
  handleConstruction: string;
  handleMaterial: string;
  handleFinish: string;
  variants: VariantFormData[];
  whereToFind: WhereToFindFormData[];
}

export interface KnifeFormData {
  slug: string;
  name: string;
  maker: string;
  makerSlug: string;
  bladeStyle: string;
  priceRange: string;
  coverPhotoUrl: string;
  description: string;
  versions: VersionFormData[];
}

export const listMakers = () =>
  axiosApiInstanceAuth.get<MakerSummary[]>("/catalog/any/makers").then((res) => res.data);

export const getMaker = (slug: string) =>
  axiosApiInstanceAuth.get(`/catalog/any/makers/${slug}`).then((res) => res.data);

export const createMaker = (dto: MakerFormData) =>
  axiosApiInstanceAuth.post("/admin/catalog/makers", dto).then((res) => res.data);

export const updateMaker = (slug: string, dto: MakerFormData) =>
  axiosApiInstanceAuth.put(`/admin/catalog/makers/${slug}`, dto).then((res) => res.data);

export const deleteMaker = (slug: string) =>
  axiosApiInstanceAuth.delete(`/admin/catalog/makers/${slug}`);

export const importCatalog = (payload: CatalogImportPayload) =>
  axiosApiInstanceAuth.post("/admin/catalog/import", payload).then((res) => res.data);

export const listKnives = () =>
  axiosApiInstanceAuth.get<KnifeSummary[]>("/catalog/any/knives").then((res) => res.data);

export const getKnife = (slug: string) =>
  axiosApiInstanceAuth.get(`/catalog/any/knives/${slug}`).then((res) => res.data);

export const createKnife = (dto: KnifeFormData) =>
  axiosApiInstanceAuth.post("/admin/catalog/knives", dto).then((res) => res.data);

export const updateKnife = (slug: string, dto: KnifeFormData) =>
  axiosApiInstanceAuth.put(`/admin/catalog/knives/${slug}`, dto).then((res) => res.data);

export const deleteKnife = (slug: string) =>
  axiosApiInstanceAuth.delete(`/admin/catalog/knives/${slug}`);
