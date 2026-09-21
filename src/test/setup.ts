import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement the Blob URL APIs; components that preview a
// selected File (e.g. via URL.createObjectURL) need these to exist.
if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:mock-url";
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

// jsdom doesn't implement IntersectionObserver; components that use it for
// lazy-loading/autoplay-on-scroll just need the constructor to exist and the
// instance methods to be no-ops. Tests that need to trigger intersection
// entries should mock this further themselves.
if (!("IntersectionObserver" in globalThis)) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
}

// jsdom doesn't implement Element.scrollTo; components that scroll a
// container into view on update just need the method to exist as a no-op.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
