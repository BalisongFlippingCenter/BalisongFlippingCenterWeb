import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import KnifeMSRPInput from "./KnifeMSRPInput";

describe("KnifeMSRPInput", () => {
  it("displays the USD value as-is and reports USD unchanged when the user has no currency preference", () => {
    const onChange = vi.fn();
    renderWithProviders(<KnifeMSRPInput setKnifeMSRPOnChange={onChange} parentMSRP="100" />);
    const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    expect(input.value).toBe("100");
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("converts the incoming USD value to EUR for display when the user's currency is EUR", () => {
    const store = makeTestStore(null, makeProfile({ currency: "EUR" }));
    renderWithProviders(<KnifeMSRPInput setKnifeMSRPOnChange={vi.fn()} parentMSRP="100" />, store as any);
    const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    expect(input.value).toBe("92.00");
    expect(screen.getByText("€")).toBeInTheDocument();
  });

  it("leaves an empty/invalid parentMSRP untouched instead of converting it", () => {
    const store = makeTestStore(null, makeProfile({ currency: "EUR" }));
    renderWithProviders(<KnifeMSRPInput setKnifeMSRPOnChange={vi.fn()} parentMSRP="" />, store as any);
    const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("always reports the value back in USD, converting from EUR input", () => {
    const onChange = vi.fn();
    const store = makeTestStore(null, makeProfile({ currency: "EUR" }));
    renderWithProviders(<KnifeMSRPInput setKnifeMSRPOnChange={onChange} parentMSRP="" />, store as any);
    const input = screen.getByPlaceholderText("0.00");
    fireEvent.change(input, { target: { value: "92" } });
    expect(onChange).toHaveBeenCalledWith("100.00");
  });

  it("reports the raw value in USD when the user has no EUR preference", () => {
    const onChange = vi.fn();
    renderWithProviders(<KnifeMSRPInput setKnifeMSRPOnChange={onChange} parentMSRP="" />);
    const input = screen.getByPlaceholderText("0.00");
    fireEvent.change(input, { target: { value: "50" } });
    expect(onChange).toHaveBeenCalledWith("50.00");
  });

  it("normalizes the displayed value to two decimals on blur", () => {
    renderWithProviders(<KnifeMSRPInput setKnifeMSRPOnChange={vi.fn()} parentMSRP="" />);
    const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "50.5" } });
    fireEvent.blur(input);
    expect(input.value).toBe("50.50");
  });
});
