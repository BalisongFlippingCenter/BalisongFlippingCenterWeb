import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { pivotSystem } from "../../comboBoxData/PivotSystem";
import PivotSystemInput from "./PivotSystemInput";

describe("PivotSystemInput", () => {
  it("renders every pivot system option", () => {
    renderWithProviders(<PivotSystemInput setPivotSystemOnChange={vi.fn()} parentPivotSystem="Bushings" />);
    for (const value of pivotSystem) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(<PivotSystemInput setPivotSystemOnChange={vi.fn()} parentPivotSystem="Washers" />);
    expect(screen.getByRole("combobox")).toHaveValue("Washers");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(<PivotSystemInput setPivotSystemOnChange={onChange} parentPivotSystem="Bushings" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Bearings" } });
    expect(onChange).toHaveBeenCalledWith("Bearings");
    expect(screen.getByRole("combobox")).toHaveValue("Bearings");
  });
});
