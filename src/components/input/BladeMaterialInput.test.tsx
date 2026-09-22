import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { bladeMaterial } from "../../comboBoxData/BladeMaterial";
import BladeMaterialInput from "./BladeMaterialInput";

describe("BladeMaterialInput", () => {
  it("renders every blade material option", () => {
    renderWithProviders(<BladeMaterialInput setBladeMaterialOnChange={vi.fn()} parentBladeMaterial="Titanium" />);
    for (const value of bladeMaterial) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(<BladeMaterialInput setBladeMaterialOnChange={vi.fn()} parentBladeMaterial="M390" />);
    expect(screen.getByRole("combobox")).toHaveValue("M390");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(<BladeMaterialInput setBladeMaterialOnChange={onChange} parentBladeMaterial="Titanium" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "MagnaCut" } });
    expect(onChange).toHaveBeenCalledWith("MagnaCut");
    expect(screen.getByRole("combobox")).toHaveValue("MagnaCut");
  });
});
