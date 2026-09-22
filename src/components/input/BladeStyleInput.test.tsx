import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { bladeStyle } from "../../comboBoxData/BladeStyle";
import BladeStyleInput from "./BladeStyleInput";

describe("BladeStyleInput", () => {
  it("renders every blade style option", () => {
    renderWithProviders(<BladeStyleInput setBladeStyleOnChange={vi.fn()} parentBladeStyle="Tanto" />);
    for (const value of bladeStyle) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(<BladeStyleInput setBladeStyleOnChange={vi.fn()} parentBladeStyle="Drop Point" />);
    expect(screen.getByRole("combobox")).toHaveValue("Drop Point");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(<BladeStyleInput setBladeStyleOnChange={onChange} parentBladeStyle="Tanto" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Clip Point" } });
    expect(onChange).toHaveBeenCalledWith("Clip Point");
    expect(screen.getByRole("combobox")).toHaveValue("Clip Point");
  });
});
