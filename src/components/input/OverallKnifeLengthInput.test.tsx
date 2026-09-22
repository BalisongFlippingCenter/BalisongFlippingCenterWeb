import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import OverallKnifeLengthInput from "./OverallKnifeLengthInput";

describe("OverallKnifeLengthInput", () => {
  it("displays inches as-is and reports inches unchanged by default", () => {
    renderWithProviders(<OverallKnifeLengthInput setOverallLengthOnChange={vi.fn()} parentKnifeLength="5" />);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    expect(input.value).toBe("5");
  });

  it("converts the incoming inches value to cm for display when the user's measurement unit is metric", () => {
    const store = makeTestStore(null, makeProfile({ measurementUnit: "metric" }));
    renderWithProviders(
      <OverallKnifeLengthInput setOverallLengthOnChange={vi.fn()} parentKnifeLength="5" />,
      store as any,
    );
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    expect(input.value).toBe("12.7");
  });

  it("leaves an empty/invalid parentKnifeLength untouched instead of converting it", () => {
    const store = makeTestStore(null, makeProfile({ measurementUnit: "metric" }));
    renderWithProviders(<OverallKnifeLengthInput setOverallLengthOnChange={vi.fn()} parentKnifeLength="" />, store as any);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("persists the raw value in inches while the unit toggle is In", () => {
    const onChange = vi.fn();
    renderWithProviders(<OverallKnifeLengthInput setOverallLengthOnChange={onChange} parentKnifeLength="" />);
    fireEvent.change(screen.getByPlaceholderText("0.0"), { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith("5.0");
  });

  it("converts cm input back to inches before persisting after switching the toggle to cm", () => {
    const onChange = vi.fn();
    renderWithProviders(<OverallKnifeLengthInput setOverallLengthOnChange={onChange} parentKnifeLength="" />);
    fireEvent.click(screen.getByRole("button", { name: "cm" }));
    fireEvent.change(screen.getByPlaceholderText("0.0"), { target: { value: "12.7" } });
    expect(onChange).toHaveBeenCalledWith("5.0");
  });

  it("converts the displayed value when the unit toggle changes, in both directions", () => {
    renderWithProviders(<OverallKnifeLengthInput setOverallLengthOnChange={vi.fn()} parentKnifeLength="5" />);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "cm" }));
    expect(input.value).toBe("12.7");
    fireEvent.click(screen.getByRole("button", { name: "In" }));
    expect(input.value).toBe("5.0");
  });

  it("normalizes the displayed value to one decimal on blur", () => {
    renderWithProviders(<OverallKnifeLengthInput setOverallLengthOnChange={vi.fn()} parentKnifeLength="" />);
    const input = screen.getByPlaceholderText("0.0") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5.25" } });
    fireEvent.blur(input);
    expect(input.value).toBe("5.3");
  });
});
