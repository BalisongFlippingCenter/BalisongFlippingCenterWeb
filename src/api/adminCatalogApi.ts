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
