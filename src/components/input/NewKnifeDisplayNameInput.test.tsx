import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import { CollectionKnife } from "../../modals/CollectionKnife";
import NewKnifeDisplayNameInput from "./NewKnifeDisplayNameInput";

function renderInput(existingNames: string[] = [], parentDisplayName = "") {
  const store = makeTestStore();
  store.dispatch(
    setCollection({
      id: "col-1",
      userId: "u1",
      bannerImg: null,
      featuredKnifeId: null,
      collectedKnives: existingNames.map(
        (displayName) => ({ id: displayName, displayName }) as unknown as CollectionKnife,
      ),
    }),
  );
  const onChange = vi.fn();
  renderWithProviders(
    <NewKnifeDisplayNameInput setDisplayNameOnChange={onChange} parentDisplayName={parentDisplayName} />,
    store as any,
  );
  return { onChange };
}

describe("NewKnifeDisplayNameInput", () => {
  it("reports each keystroke to the parent", () => {
    const { onChange } = renderInput();
    fireEvent.change(screen.getByPlaceholderText("e.g. My Benchmade 51"), { target: { value: "New Knife" } });
    expect(onChange).toHaveBeenCalledWith("New Knife");
  });

  it("flags a name that collides with an existing knife in the collection", () => {
    renderInput(["Taken Name"]);
    fireEvent.change(screen.getByPlaceholderText("e.g. My Benchmade 51"), { target: { value: "Taken Name" } });
    expect(screen.getByText("Name already in use")).toBeInTheDocument();
  });

  it("does not flag a unique name", () => {
    renderInput(["Taken Name"]);
    fireEvent.change(screen.getByPlaceholderText("e.g. My Benchmade 51"), { target: { value: "Unique Name" } });
    expect(screen.queryByText("Name already in use")).not.toBeInTheDocument();
  });

  it("syncs its displayed value when parentDisplayName changes externally", () => {
    const store = makeTestStore();
    const wrap = (name: string) => (
      <Provider store={store}>
        <MemoryRouter>
          <NewKnifeDisplayNameInput setDisplayNameOnChange={vi.fn()} parentDisplayName={name} />
        </MemoryRouter>
      </Provider>
    );
    const { rerender } = render(wrap("Initial"));
    expect(screen.getByPlaceholderText("e.g. My Benchmade 51")).toHaveValue("Initial");

    rerender(wrap("Updated"));
    expect(screen.getByPlaceholderText("e.g. My Benchmade 51")).toHaveValue("Updated");
  });
});
