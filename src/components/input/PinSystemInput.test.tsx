import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { pinSystem } from "../../comboBoxData/PinSystem";
import PinSystemInput from "./PinSystemInput";

describe("PinSystemInput", () => {
  it("renders every pin system option", () => {
    renderWithProviders(<PinSystemInput setPinSystemOnChange={vi.fn()} parentPinSystem="Tang Pins" />);
    for (const value of pinSystem) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(<PinSystemInput setPinSystemOnChange={vi.fn()} parentPinSystem="Zen Pins" />);
    expect(screen.getByRole("combobox")).toHaveValue("Zen Pins");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(<PinSystemInput setPinSystemOnChange={onChange} parentPinSystem="Tang Pins" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Pinless" } });
    expect(onChange).toHaveBeenCalledWith("Pinless");
    expect(screen.getByRole("combobox")).toHaveValue("Pinless");
  });
});
