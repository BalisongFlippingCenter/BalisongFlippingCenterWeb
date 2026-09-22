import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { handleConstruction } from "../../comboBoxData/HandleConstruction";
import HandleConstructionInput from "./HandleConstructionInput";

describe("HandleConstructionInput", () => {
  it("renders every handle construction option", () => {
    renderWithProviders(
      <HandleConstructionInput setHandleConstructionOnChange={vi.fn()} parentHandleConstruction="Chanel" />,
    );
    for (const value of handleConstruction) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(
      <HandleConstructionInput setHandleConstructionOnChange={vi.fn()} parentHandleConstruction="Sandwhich" />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("Sandwhich");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <HandleConstructionInput setHandleConstructionOnChange={onChange} parentHandleConstruction="Chanel" />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Chanwhich" } });
    expect(onChange).toHaveBeenCalledWith("Chanwhich");
    expect(screen.getByRole("combobox")).toHaveValue("Chanwhich");
  });
});
