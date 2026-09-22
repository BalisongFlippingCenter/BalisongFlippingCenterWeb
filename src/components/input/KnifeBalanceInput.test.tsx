import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import KnifeBalanceInput from "./KnifeBalanceInput";

describe("KnifeBalanceInput", () => {
  it("notifies the parent of the default balance (3) on mount when no balance value is set", () => {
    const setBalanceOnChange = vi.fn();
    renderWithProviders(
      <KnifeBalanceInput
        setBalanceOnChange={setBalanceOnChange}
        setHasModulatedBalanceOnChange={vi.fn()}
        parentHasModulatedBalance={false}
        parentBalanceValue={null}
      />,
    );
    expect(setBalanceOnChange).toHaveBeenCalledWith(3);
    expect(screen.getByText("Neutral", { selector: "span.text-blue-primary" })).toBeInTheDocument();
  });

  it("initializes the slider from an existing parent balance value without renotifying the parent", () => {
    const setBalanceOnChange = vi.fn();
    renderWithProviders(
      <KnifeBalanceInput
        setBalanceOnChange={setBalanceOnChange}
        setHasModulatedBalanceOnChange={vi.fn()}
        parentHasModulatedBalance={false}
        parentBalanceValue={5}
      />,
    );
    expect(setBalanceOnChange).not.toHaveBeenCalled();
    expect(screen.getByText("Handle Bias")).toBeInTheDocument();
  });

  it("hides the balance slider entirely when modular balance is enabled", () => {
    renderWithProviders(
      <KnifeBalanceInput
        setBalanceOnChange={vi.fn()}
        setHasModulatedBalanceOnChange={vi.fn()}
        parentHasModulatedBalance={true}
        parentBalanceValue={null}
      />,
    );
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("switching to modular balance clears the balance value and reveals the toggle state to the parent", () => {
    const setBalanceOnChange = vi.fn();
    const setHasModulatedBalanceOnChange = vi.fn();
    renderWithProviders(
      <KnifeBalanceInput
        setBalanceOnChange={setBalanceOnChange}
        setHasModulatedBalanceOnChange={setHasModulatedBalanceOnChange}
        parentHasModulatedBalance={false}
        parentBalanceValue={3}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(setBalanceOnChange).toHaveBeenCalledWith(null);
    expect(setHasModulatedBalanceOnChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("switching off modular balance restores the current balance value to the parent", () => {
    const setBalanceOnChange = vi.fn();
    const setHasModulatedBalanceOnChange = vi.fn();
    renderWithProviders(
      <KnifeBalanceInput
        setBalanceOnChange={setBalanceOnChange}
        setHasModulatedBalanceOnChange={setHasModulatedBalanceOnChange}
        parentHasModulatedBalance={true}
        parentBalanceValue={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(setBalanceOnChange).toHaveBeenCalledWith("3");
    expect(setHasModulatedBalanceOnChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("clicking the already-active toggle option is a no-op", () => {
    const setBalanceOnChange = vi.fn();
    const setHasModulatedBalanceOnChange = vi.fn();
    renderWithProviders(
      <KnifeBalanceInput
        setBalanceOnChange={setBalanceOnChange}
        setHasModulatedBalanceOnChange={setHasModulatedBalanceOnChange}
        parentHasModulatedBalance={false}
        parentBalanceValue={3}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(setHasModulatedBalanceOnChange).not.toHaveBeenCalled();
  });

  it("moving the slider updates the label and reports the numeric value", () => {
    const setBalanceOnChange = vi.fn();
    renderWithProviders(
      <KnifeBalanceInput
        setBalanceOnChange={setBalanceOnChange}
        setHasModulatedBalanceOnChange={vi.fn()}
        parentHasModulatedBalance={false}
        parentBalanceValue={3}
      />,
    );
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0" } });
    expect(setBalanceOnChange).toHaveBeenCalledWith(0);
    expect(screen.getByText("Heavy Blade")).toBeInTheDocument();
  });
});
