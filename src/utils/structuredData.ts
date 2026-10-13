import { SITE_NAME, SITE_URL, StructuredData } from "../hooks/usePageMeta";

export const LOGO_URL = `${SITE_URL}/bfc-logo-512.png`;

export const siteOrganization: StructuredData = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: LOGO_URL,
  email: "support.balisongflippingcenter@gmail.com",
};

export const siteWebsite: StructuredData = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const sitePublisher: StructuredData = {
  "@type": "Organization",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: LOGO_URL,
};

export const breadcrumbs = (crumbs: [name: string, path: string][]): StructuredData => ({
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map(([name, path], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: SITE_URL + path,
  })),
});
