import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OtpInput from "./OtpInput";

function digitInputs() {
  return screen.getAllByRole("textbox") as HTMLInputElement[];
}

describe("OtpInput", () => {
  it("renders one box per digit of the value, defaulting to length 6", () => {
    render(<OtpInput value="123" onChange={vi.fn()} />);
    const inputs = digitInputs();
    expect(inputs).toHaveLength(6);
    expect(inputs.map((i) => i.value)).toEqual(["1", "2", "3", "", "", ""]);
  });

  it("respects a custom length", () => {
    render(<OtpInput value="" onChange={vi.fn()} length={4} />);
    expect(digitInputs()).toHaveLength(4);
  });

  it("typing a digit updates the joined value and advances focus to the next box", () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = digitInputs();
    fireEvent.change(inputs[0], { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith("5");
    expect(document.activeElement).toBe(inputs[1]);
  });

  it("strips non-digit characters and keeps only the last character typed", () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    fireEvent.change(digitInputs()[0], { target: { value: "a9b" } });
    expect(onChange).toHaveBeenCalledWith("9");
  });

  it("does not advance focus past the last box", () => {
    const onChange = vi.fn();
    render(<OtpInput value="12345" onChange={onChange} />);
    const inputs = digitInputs();
    inputs[5].focus();
    fireEvent.change(inputs[5], { target: { value: "6" } });
    expect(document.activeElement).toBe(inputs[5]);
  });

  it("Backspace on a filled box clears it without moving focus", () => {
    const onChange = vi.fn();
    render(<OtpInput value="123456" onChange={onChange} />);
    const inputs = digitInputs();
    inputs[2].focus();
    fireEvent.keyDown(inputs[2], { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith("12456");
    expect(document.activeElement).toBe(inputs[2]);
  });

  it("Backspace on an empty box clears the previous box and moves focus back", () => {
    const onChange = vi.fn();
    render(<OtpInput value="12" onChange={onChange} />);
    const inputs = digitInputs();
    fireEvent.keyDown(inputs[2], { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith("1");
    expect(document.activeElement).toBe(inputs[1]);
  });

  it("ArrowLeft/ArrowRight move focus between boxes without changing the value", () => {
    const onChange = vi.fn();
    render(<OtpInput value="123456" onChange={onChange} />);
    const inputs = digitInputs();
    fireEvent.keyDown(inputs[2], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(inputs[1]);
    fireEvent.keyDown(inputs[1], { key: "ArrowRight" });
    expect(document.activeElement).toBe(inputs[2]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("pasting a full code fills all boxes and focuses the last one", () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = digitInputs();
    fireEvent.paste(inputs[0], { clipboardData: { getData: () => "654321" } });
    expect(onChange).toHaveBeenCalledWith("654321");
    expect(document.activeElement).toBe(inputs[5]);
  });

  it("pasting strips non-digits and focuses the box after the last pasted digit", () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = digitInputs();
    fireEvent.paste(inputs[0], { clipboardData: { getData: () => "12-34" } });
    expect(onChange).toHaveBeenCalledWith("1234");
    expect(document.activeElement).toBe(inputs[4]);
  });
});
