import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import KnifeMakerInput from "./KnifeMakerInput";

describe("KnifeMakerInput", () => {
  it("displays the parent's current value", () => {
    renderWithProviders(<KnifeMakerInput setKnifeMakerOnChange={vi.fn()} parentKnifeMaker="Benchmade" />);
    expect(screen.getByPlaceholderText("e.g. Benchmade")).toHaveValue("Benchmade");
  });

  it("reports each keystroke to the parent", () => {
    const onChange = vi.fn();
    renderWithProviders(<KnifeMakerInput setKnifeMakerOnChange={onChange} parentKnifeMaker="" />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Benchmade"), { target: { value: "Squid Industries" } });
    expect(onChange).toHaveBeenCalledWith("Squid Industries");
  });

  it("syncs its displayed value when parentKnifeMaker changes externally", () => {
    const store = makeTestStore();
    const wrap = (value: string) => (
      <Provider store={store}>
        <MemoryRouter>
          <KnifeMakerInput setKnifeMakerOnChange={vi.fn()} parentKnifeMaker={value} />
        </MemoryRouter>
      </Provider>
    );
    const { rerender } = render(wrap("Benchmade"));
    expect(screen.getByPlaceholderText("e.g. Benchmade")).toHaveValue("Benchmade");

    rerender(wrap("Squid Industries"));
    expect(screen.getByPlaceholderText("e.g. Benchmade")).toHaveValue("Squid Industries");
  });
});
