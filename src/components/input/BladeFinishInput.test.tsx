import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { bladeFinish } from "../../comboBoxData/BladeFinish";
import BladeFinishInput from "./BladeFinishInput";

describe("BladeFinishInput", () => {
  it("renders every blade finish option", () => {
    renderWithProviders(<BladeFinishInput setBladeFinishOnChange={vi.fn()} parentBladeFinish="Satin" />);
    for (const value of bladeFinish) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(<BladeFinishInput setBladeFinishOnChange={vi.fn()} parentBladeFinish="Stonewash" />);
    expect(screen.getByRole("combobox")).toHaveValue("Stonewash");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(<BladeFinishInput setBladeFinishOnChange={onChange} parentBladeFinish="Satin" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Mirror Polished" } });
    expect(onChange).toHaveBeenCalledWith("Mirror Polished");
    expect(screen.getByRole("combobox")).toHaveValue("Mirror Polished");
  });
});
