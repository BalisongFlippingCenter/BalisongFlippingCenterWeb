import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import KnifeWeightInput from "./KnifeWeightInput";

describe("KnifeWeightInput", () => {
  it("displays oz as-is by default", () => {
    renderWithProviders(<KnifeWeightInput setKnifeWeightOnChange={vi.fn()} parentWeight="4" />);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    expect(input.value).toBe("4");
  });

  it("converts the incoming oz value to grams for display when the user's measurement unit is metric", () => {
    const store = makeTestStore(null, makeProfile({ measurementUnit: "metric" }));
    renderWithProviders(<KnifeWeightInput setKnifeWeightOnChange={vi.fn()} parentWeight="1" />, store as any);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    expect(input.value).toBe("28.3");
  });

  it("leaves an empty/invalid parentWeight untouched instead of converting it", () => {
    const store = makeTestStore(null, makeProfile({ measurementUnit: "metric" }));
    renderWithProviders(<KnifeWeightInput setKnifeWeightOnChange={vi.fn()} parentWeight="" />, store as any);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("persists the raw value in oz while the unit toggle is oz (trimming a trailing .X0 to one decimal)", () => {
    const onChange = vi.fn();
    renderWithProviders(<KnifeWeightInput setKnifeWeightOnChange={onChange} parentWeight="" />);
    fireEvent.change(screen.getByPlaceholderText("0.0"), { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith("4.0");
  });

  it("converts gram input back to oz before persisting after switching the toggle to g", () => {
    const onChange = vi.fn();
    renderWithProviders(<KnifeWeightInput setKnifeWeightOnChange={onChange} parentWeight="" />);
    fireEvent.click(screen.getByRole("button", { name: "g" }));
    fireEvent.change(screen.getByPlaceholderText("0.0"), { target: { value: "28.3495" } });
    expect(onChange).toHaveBeenCalledWith("1.0");
  });

  it("converts the displayed value when the unit toggle changes, in both directions", () => {
    renderWithProviders(<KnifeWeightInput setKnifeWeightOnChange={vi.fn()} parentWeight="1" />);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "g" }));
    expect(input.value).toBe("28.3");
    fireEvent.click(screen.getByRole("button", { name: "oz" }));
    expect(input.value).toBe("1.0");
  });

  it("normalizes the displayed value on blur using unit-appropriate decimal places", () => {
    renderWithProviders(<KnifeWeightInput setKnifeWeightOnChange={vi.fn()} parentWeight="" />);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "4.567" } });
    fireEvent.blur(input);
    expect(input.value).toBe("4.57");
  });
});
