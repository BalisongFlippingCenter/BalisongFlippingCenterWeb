import { describe, it, expect } from "vitest";
import { formatCurrency, formatWeight, formatLength } from "./unitConversions";

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(100, "USD")).toBe("$100.00");
  });

  it("converts to EUR", () => {
    expect(formatCurrency(100, "EUR")).toBe("€92.00");
  });

  it("returns empty string for null, zero, negative, or NaN", () => {
    expect(formatCurrency(null, "USD")).toBe("");
    expect(formatCurrency(0, "USD")).toBe("");
    expect(formatCurrency(-5, "USD")).toBe("");
    expect(formatCurrency("abc", "USD")).toBe("");
  });
});

describe("formatWeight", () => {
  it("formats oz by default", () => {
    expect(formatWeight(4, "imperial")).toBe("4.00oz");
  });

  it("converts to grams", () => {
    expect(formatWeight(1, "metric")).toBe("28.3g");
  });

  it("returns empty string for null, zero, or NaN", () => {
    expect(formatWeight(null, "imperial")).toBe("");
    expect(formatWeight(0, "imperial")).toBe("");
    expect(formatWeight("abc", "imperial")).toBe("");
  });
});

describe("formatLength", () => {
  it("formats inches by default", () => {
    expect(formatLength(5, "imperial")).toBe('5.0"');
  });

  it("converts to centimeters", () => {
    expect(formatLength(1, "metric")).toBe("2.5cm");
  });

  it("returns empty string for null, zero, or NaN", () => {
    expect(formatLength(null, "imperial")).toBe("");
    expect(formatLength(0, "imperial")).toBe("");
    expect(formatLength("abc", "imperial")).toBe("");
  });
});
