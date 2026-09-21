import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement the Blob URL APIs; components that preview a
// selected File (e.g. via URL.createObjectURL) need these to exist.
if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:mock-url";
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}
