import { describe, it, expect } from "vitest";
import { enumToLabel, BLADE_STYLE_LABELS } from "./catalogEnumLabels";

describe("enumToLabel", () => {
  it("looks up a known enum value in the given map", () => {
    expect(enumToLabel(BLADE_STYLE_LABELS, "TANTO")).toBe("Tanto");
  });

  it("returns empty string for an unrecognized value", () => {
    expect(enumToLabel(BLADE_STYLE_LABELS, "NOT_A_REAL_ENUM")).toBe("");
  });

  it("returns empty string for null or undefined", () => {
    expect(enumToLabel(BLADE_STYLE_LABELS, null)).toBe("");
    expect(enumToLabel(BLADE_STYLE_LABELS, undefined)).toBe("");
  });
});
