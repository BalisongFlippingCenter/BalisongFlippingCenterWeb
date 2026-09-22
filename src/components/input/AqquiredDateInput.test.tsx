import { describe, it, expect, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import AqquiredDateInput from "./AqquiredDateInput";

function getDateInput(container: HTMLElement) {
  return container.querySelector('input[type="date"]') as HTMLInputElement;
}

describe("AqquiredDateInput", () => {
  it("displays the parent's current value", () => {
    const { container } = renderWithProviders(
      <AqquiredDateInput setAqquiredDateOnChange={vi.fn()} parentAqquiredDate="2024-01-15" />,
    );
    expect(getDateInput(container)).toHaveValue("2024-01-15");
  });

  it("reports the new date to the parent when changed", () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <AqquiredDateInput setAqquiredDateOnChange={onChange} parentAqquiredDate="" />,
    );
    fireEvent.change(getDateInput(container), { target: { value: "2024-06-01" } });
    expect(onChange).toHaveBeenCalledWith("2024-06-01");
  });

  it("syncs its displayed value when parentAqquiredDate changes externally", () => {
    const store = makeTestStore();
    const wrap = (value: string) => (
      <Provider store={store}>
        <MemoryRouter>
          <AqquiredDateInput setAqquiredDateOnChange={vi.fn()} parentAqquiredDate={value} />
        </MemoryRouter>
      </Provider>
    );
    const { container, rerender } = render(wrap("2024-01-15"));
    expect(getDateInput(container)).toHaveValue("2024-01-15");

    rerender(wrap("2024-06-01"));
    expect(getDateInput(container)).toHaveValue("2024-06-01");
  });
});
