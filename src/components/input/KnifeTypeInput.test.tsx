import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import KnifeTypeInput from "./KnifeTypeInput";

describe("KnifeTypeInput", () => {
  it("highlights the option matching parentKnifeType", () => {
    renderWithProviders(<KnifeTypeInput setKnifeTypeOnChange={vi.fn()} parentKnifeType="trainer" />);
    expect(screen.getByRole("button", { name: "Trainer" })).toHaveClass("bg-blue-primary");
    expect(screen.getByRole("button", { name: "Live Blade" })).not.toHaveClass("bg-blue-primary");
  });

  it("reports the selected option's value to the parent", () => {
    const onChange = vi.fn();
    renderWithProviders(<KnifeTypeInput setKnifeTypeOnChange={onChange} parentKnifeType="trainer" />);
    fireEvent.click(screen.getByRole("button", { name: "Both" }));
    expect(onChange).toHaveBeenCalledWith("both");
  });

  it("reports liveblade and trainer values correctly", () => {
    const onChange = vi.fn();
    renderWithProviders(<KnifeTypeInput setKnifeTypeOnChange={onChange} parentKnifeType="" />);
    fireEvent.click(screen.getByRole("button", { name: "Live Blade" }));
    expect(onChange).toHaveBeenCalledWith("liveblade");
    fireEvent.click(screen.getByRole("button", { name: "Trainer" }));
    expect(onChange).toHaveBeenCalledWith("trainer");
  });
});
