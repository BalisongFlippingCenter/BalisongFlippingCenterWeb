import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import BaseKnifeModelInput from "./BaseKnifeModelInput";

describe("BaseKnifeModelInput", () => {
  it("displays the parent's current value", () => {
    renderWithProviders(<BaseKnifeModelInput setBaseKnifeModelOnChange={vi.fn()} parentBaseKnifeModel="51" />);
    expect(screen.getByPlaceholderText("e.g. 51")).toHaveValue("51");
  });

  it("reports each keystroke to the parent", () => {
    const onChange = vi.fn();
    renderWithProviders(<BaseKnifeModelInput setBaseKnifeModelOnChange={onChange} parentBaseKnifeModel="" />);
    fireEvent.change(screen.getByPlaceholderText("e.g. 51"), { target: { value: "62" } });
    expect(onChange).toHaveBeenCalledWith("62");
  });

  it("syncs its displayed value when parentBaseKnifeModel changes externally", () => {
    const store = makeTestStore();
    const wrap = (value: string) => (
      <Provider store={store}>
        <MemoryRouter>
          <BaseKnifeModelInput setBaseKnifeModelOnChange={vi.fn()} parentBaseKnifeModel={value} />
        </MemoryRouter>
      </Provider>
    );
    const { rerender } = render(wrap("51"));
    expect(screen.getByPlaceholderText("e.g. 51")).toHaveValue("51");

    rerender(wrap("62"));
    expect(screen.getByPlaceholderText("e.g. 51")).toHaveValue("62");
  });
});
