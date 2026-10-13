import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { usePageMeta, DEFAULT_DESCRIPTION, SITE_NAME } from "./usePageMeta";

type Props = Parameters<typeof usePageMeta>[0];

const Page = (props: Props) => {
  usePageMeta(props);
  return null;
};

const renderAt = (path: string, props: Props) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Page {...props} />
    </MemoryRouter>
  );

const meta = (selector: string) => document.head.querySelector<HTMLMetaElement>(selector)?.content;
const canonical = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;

describe("usePageMeta", () => {
  it("sets the title, description, and canonical URL for the current path", () => {
    renderAt("/learn/balisong-legality/", { title: "Balisong Legality", description: "Know your laws." });

    expect(document.title).toBe(`Balisong Legality | ${SITE_NAME}`);
    expect(meta('meta[name="description"]')).toBe("Know your laws.");
    expect(meta('meta[property="og:title"]')).toBe(`Balisong Legality | ${SITE_NAME}`);
    expect(canonical()).toBe("https://www.balisongflippingcenter.com/learn/balisong-legality");
    expect(meta('meta[property="og:url"]')).toBe("https://www.balisongflippingcenter.com/learn/balisong-legality");
    expect(meta('meta[name="robots"]')).toBeUndefined();
  });

  it("uses the path override as the canonical URL", () => {
    renderAt("/product-world/knife/squiddy/v1/trainer", { title: "Squiddy", path: "/product-world/knife/squiddy" });

    expect(canonical()).toBe("https://www.balisongflippingcenter.com/product-world/knife/squiddy");
  });

  it("falls back to the site name and default description", () => {
    renderAt("/", {});

    expect(document.title).toBe(SITE_NAME);
    expect(meta('meta[name="description"]')).toBe(DEFAULT_DESCRIPTION);
  });

  it("truncates long descriptions at a word boundary", () => {
    renderAt("/", { description: "word ".repeat(60) });

    const description = meta('meta[name="description"]')!;
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description.endsWith("word…")).toBe(true);
  });

  it("marks noindex pages and drops their canonical URL", () => {
    renderAt("/search", { title: "Search", noindex: true });

    expect(meta('meta[name="robots"]')).toBe("noindex");
    expect(canonical()).toBeUndefined();
  });

  it("restores the defaults on unmount", () => {
    const { unmount } = renderAt("/search", { title: "Search", noindex: true });
    unmount();

    expect(document.title).toBe(SITE_NAME);
    expect(meta('meta[name="robots"]')).toBeUndefined();
    expect(canonical()).toBeUndefined();
  });
});
