import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import CollectionKnifeCoverPhotoInput from "./CollectionKnifeCoverPhotoInput";

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("CollectionKnifeCoverPhotoInput", () => {
  it("shows the upload prompt when no file is selected", () => {
    renderWithProviders(<CollectionKnifeCoverPhotoInput setCoverFileOnChange={vi.fn()} parentCoverFile={null} />);
    expect(screen.getByText("Upload cover photo")).toBeInTheDocument();
  });

  it("reports the selected file to the parent and shows a preview", () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <CollectionKnifeCoverPhotoInput setCoverFileOnChange={onChange} parentCoverFile={null} />,
    );
    const file = new File(["cover"], "cover.png", { type: "image/png" });
    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(file);
    expect(screen.queryByText("Upload cover photo")).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("syncs its preview when parentCoverFile changes externally", () => {
    const store = makeTestStore();
    const file = new File(["cover"], "cover.png", { type: "image/png" });
    const wrap = (parentCoverFile: File | null) => (
      <Provider store={store}>
        <MemoryRouter>
          <CollectionKnifeCoverPhotoInput setCoverFileOnChange={vi.fn()} parentCoverFile={parentCoverFile} />
        </MemoryRouter>
      </Provider>
    );
    const { container, rerender } = render(wrap(null));
    expect(screen.getByText("Upload cover photo")).toBeInTheDocument();

    rerender(wrap(file));
    expect(screen.queryByText("Upload cover photo")).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeInTheDocument();
  });
});
