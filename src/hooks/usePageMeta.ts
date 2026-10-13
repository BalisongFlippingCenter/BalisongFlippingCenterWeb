import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const SITE_NAME = "Balisong Flipping Center";
export const SITE_URL = "https://www.balisongflippingcenter.com";
export const DEFAULT_DESCRIPTION =
  "The community hub for balisong flippers — share your collection, learn tricks from beginner to advanced, and browse a catalog of butterfly knives and trainers.";

const MAX_DESCRIPTION_LENGTH = 160;
const STRUCTURED_DATA_ID = "page-structured-data";

export type StructuredData = Record<string, unknown>;

interface PageMeta {
  title?: string;
  description?: string | null;
  // Overrides the current pathname as the canonical URL, e.g. to fold variant URLs into one page
  path?: string;
  noindex?: boolean;
  // schema.org JSON-LD nodes, emitted as a single @graph
  structuredData?: StructuredData[];
}

const truncate = (text: string) => {
  if (text.length <= MAX_DESCRIPTION_LENGTH) return text;
  const cut = text.slice(0, MAX_DESCRIPTION_LENGTH - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:—-]+$/, "") + "…";
};

const setMeta = (attr: "name" | "property", key: string, content: string | null) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
};

const setCanonical = (href: string | null) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
};

const setStructuredData = (json: string | null) => {
  let el = document.getElementById(STRUCTURED_DATA_ID) as HTMLScriptElement | null;
  if (json === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.id = STRUCTURED_DATA_ID;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = json;
};

const applyMeta = (title: string, description: string, url: string | null, noindex: boolean, structuredData: string | null) => {
  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("name", "robots", noindex ? "noindex" : null);
  setCanonical(url);
  setStructuredData(structuredData);
};

export const usePageMeta = ({ title, description, path, noindex = false, structuredData }: PageMeta) => {
  const { pathname } = useLocation();
  const canonicalPath = (path ?? pathname).replace(/\/+$/, "") || "/";
  const structuredDataJson =
    structuredData?.length && !noindex
      ? JSON.stringify({ "@context": "https://schema.org", "@graph": structuredData })
      : null;

  useEffect(() => {
    applyMeta(
      title ? `${title} | ${SITE_NAME}` : SITE_NAME,
      truncate(description || DEFAULT_DESCRIPTION),
      noindex ? null : SITE_URL + canonicalPath,
      noindex,
      structuredDataJson,
    );
    return () => applyMeta(SITE_NAME, DEFAULT_DESCRIPTION, null, false, null);
  }, [title, description, canonicalPath, noindex, structuredDataJson]);
};
