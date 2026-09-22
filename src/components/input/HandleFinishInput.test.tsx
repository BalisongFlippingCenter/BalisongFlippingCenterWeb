import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { handleFinish } from "../../comboBoxData/HandleFinish";
import HandleFinishInput from "./HandleFinishInput";

describe("HandleFinishInput", () => {
  it("renders every handle finish option", () => {
    renderWithProviders(<HandleFinishInput setHandleFinishOnChange={vi.fn()} parentHandleFinish="Plain" />);
    for (const value of handleFinish) {
      expect(screen.getByRole("option", { name: value })).toBeInTheDocument();
    }
  });

  it("selects the parent's current value", () => {
    renderWithProviders(<HandleFinishInput setHandleFinishOnChange={vi.fn()} parentHandleFinish="Anodized" />);
    expect(screen.getByRole("combobox")).toHaveValue("Anodized");
  });

  it("reports the new value to the parent when the user selects an option", () => {
    const onChange = vi.fn();
    renderWithProviders(<HandleFinishInput setHandleFinishOnChange={onChange} parentHandleFinish="Plain" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Mirror Polish" } });
    expect(onChange).toHaveBeenCalledWith("Mirror Polish");
    expect(screen.getByRole("combobox")).toHaveValue("Mirror Polish");
  });
});
