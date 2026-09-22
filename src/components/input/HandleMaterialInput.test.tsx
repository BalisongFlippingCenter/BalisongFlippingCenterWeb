import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { handleMaterial } from "../../comboBoxData/HandleMaterial";
import HandleMaterialInput from "./HandleMaterialInput";

describe("HandleMaterialInput", () => {
  it("renders every handle material option", () => {
    renderWithProviders(<HandleMaterialInput setHandleMaterialOnChange={vi.fn()} parentHandleMaterial="Titanium" />);
    for (const value of handleMaterial) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(<HandleMaterialInput setHandleMaterialOnChange={vi.fn()} parentHandleMaterial="G-10" />);
    expect(screen.getByRole("combobox")).toHaveValue("G-10");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(<HandleMaterialInput setHandleMaterialOnChange={onChange} parentHandleMaterial="Titanium" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Carbon Fiber" } });
    expect(onChange).toHaveBeenCalledWith("Carbon Fiber");
    expect(screen.getByRole("combobox")).toHaveValue("Carbon Fiber");
  });
});
