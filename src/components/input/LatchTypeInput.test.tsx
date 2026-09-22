import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { latchType } from "../../comboBoxData/LatchType";
import LatchTypeInput from "./LatchTypeInput";

describe("LatchTypeInput", () => {
  it("renders every latch type option", () => {
    renderWithProviders(<LatchTypeInput setLatchTypeOnChange={vi.fn()} parentLatchType="No Latch" />);
    for (const value of latchType) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(<LatchTypeInput setLatchTypeOnChange={vi.fn()} parentLatchType="Spring Latch" />);
    expect(screen.getByRole("combobox")).toHaveValue("Spring Latch");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(<LatchTypeInput setLatchTypeOnChange={onChange} parentLatchType="No Latch" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Swing Latch" } });
    expect(onChange).toHaveBeenCalledWith("Swing Latch");
    expect(screen.getByRole("combobox")).toHaveValue("Swing Latch");
  });
});
