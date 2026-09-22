import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import { CollectionKnife, CollectionKnifeDTO } from "../../modals/CollectionKnife";
import NewCollectionKnifeForm from "./NewCollectionKnifeForm";

function makeStoreWithKnives(names: string[]) {
  const store = makeTestStore();
  store.dispatch(
    setCollection({
      id: "col-1",
      userId: "u1",
      bannerImg: null,
      featuredKnifeId: null,
      collectedKnives: names.map((displayName) => ({ id: displayName, displayName }) as unknown as CollectionKnife),
    }),
  );
  return store;
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("e.g. My Benchmade 51"), { target: { value: "My Knife" } });
  fireEvent.change(screen.getByPlaceholderText("e.g. Benchmade"), { target: { value: "Benchmade" } });
  fireEvent.change(screen.getByPlaceholderText("e.g. 51"), { target: { value: "51" } });
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: "2024-01-01" } });
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["content"], "cover.png", { type: "image/png" });
  fireEvent.change(fileInput, { target: { files: [file] } });
}

function makeCollectionKnifeObj(overrides: Partial<CollectionKnifeDTO> = {}): CollectionKnifeDTO {
  return {
    id: null,
    displayName: "Existing Knife",
    knifeMaker: "Spyderco",
    baseKnifeModel: "Model X",
    knifeType: "liveblade",
    isFavoriteKnife: false,
    isFavoriteFlipper: false,
    aqquiredDate: "2023-05-01",
    coverPhoto: new File(["x"], "x.png") as any,
    coverPhotoFileName: "x.png",
    msrp: "150",
    overallLength: "9",
    weight: "4",
    pivotSystem: "Bushings",
    latchType: "Spring Latch",
    pinSystem: "Zen Pins",
    hasModularBalance: false,
    balanceValue: 3,
    bladeStyle: "Tanto",
    bladeFinish: "Satin",
    bladeMaterial: "S35VN",
    handleConstruction: "Channel",
    handleMaterial: "Titanium",
    handleFinish: "Stonewash",
    averageScore: 7,
    qualityScore: 7,
    flippingScore: 7,
    feelScore: 7,
    soundScore: 7,
    durabilityScore: 7,
    ...overrides,
  } as CollectionKnifeDTO;
}

describe("NewCollectionKnifeForm — validity", () => {
  it("disables Continue until every required field is filled", () => {
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={vi.fn()}
        setFormNotReadyOnChange={vi.fn()}
        setStepManually={vi.fn()}
        collectionKnifeObj={null}
      />,
    );
    expect(screen.getByRole("button", { name: /Fill in required fields/ })).toBeInTheDocument();
    fillRequiredFields();
    expect(screen.getByRole("button", { name: "Continue to Gallery →" })).toBeInTheDocument();
  });

  it("disables Continue when the display name duplicates an existing knife", () => {
    const store = makeStoreWithKnives(["My Knife"]);
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={vi.fn()}
        setFormNotReadyOnChange={vi.fn()}
        setStepManually={vi.fn()}
        collectionKnifeObj={null}
      />,
      store as any,
    );
    fillRequiredFields();
    expect(screen.getByRole("button", { name: /Fill in required fields/ })).toBeInTheDocument();
  });
});

describe("NewCollectionKnifeForm — submit", () => {
  it("builds and submits the DTO with the entered values", () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={onSubmit}
        setFormNotReadyOnChange={vi.fn()}
        setStepManually={vi.fn()}
        collectionKnifeObj={null}
      />,
    );
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Continue to Gallery →" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const dto = onSubmit.mock.calls[0][0];
    expect(dto).toMatchObject({
      displayName: "My Knife",
      knifeMaker: "Benchmade",
      baseKnifeModel: "51",
      aqquiredDate: "2024-01-01",
      averageScore: 5,
      qualityScore: 5,
    });
    expect(dto.coverPhoto).toBeInstanceOf(File);
  });

  it("does not submit when the display name is a duplicate, even if the form is otherwise complete", () => {
    const onSubmit = vi.fn();
    const store = makeStoreWithKnives(["My Knife"]);
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={onSubmit}
        setFormNotReadyOnChange={vi.fn()}
        setStepManually={vi.fn()}
        collectionKnifeObj={null}
      />,
      store as any,
    );
    fillRequiredFields();
    fireEvent.submit(document.querySelector("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("NewCollectionKnifeForm — re-entering with existing data", () => {
  it("prefills all fields from collectionKnifeObj on mount", () => {
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={vi.fn()}
        setFormNotReadyOnChange={vi.fn()}
        setStepManually={vi.fn()}
        collectionKnifeObj={makeCollectionKnifeObj()}
      />,
    );
    expect(screen.getByPlaceholderText("e.g. My Benchmade 51")).toHaveValue("Existing Knife");
    expect(screen.getByPlaceholderText("e.g. Benchmade")).toHaveValue("Spyderco");
    expect(screen.getByPlaceholderText("e.g. 51")).toHaveValue("Model X");
  });

  it("enables the Gallery shortcut button when re-entering with existing data", () => {
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={vi.fn()}
        setFormNotReadyOnChange={vi.fn()}
        setStepManually={vi.fn()}
        collectionKnifeObj={makeCollectionKnifeObj()}
      />,
    );
    expect(screen.getByRole("button", { name: "Gallery" })).not.toBeDisabled();
  });

  it("marks the form not-ready as soon as a field changes after re-entering", () => {
    const setFormNotReadyOnChange = vi.fn();
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={vi.fn()}
        setFormNotReadyOnChange={setFormNotReadyOnChange}
        setStepManually={vi.fn()}
        collectionKnifeObj={makeCollectionKnifeObj()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. My Benchmade 51"), { target: { value: "Renamed" } });
    expect(setFormNotReadyOnChange).toHaveBeenCalled();
  });

  it("does not call setFormNotReadyOnChange when editing a fresh (never-submitted) form", () => {
    const setFormNotReadyOnChange = vi.fn();
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={vi.fn()}
        setFormNotReadyOnChange={setFormNotReadyOnChange}
        setStepManually={vi.fn()}
        collectionKnifeObj={null}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. My Benchmade 51"), { target: { value: "New Knife" } });
    expect(setFormNotReadyOnChange).not.toHaveBeenCalled();
  });

  it("the Gallery shortcut jumps directly to step 2", () => {
    const setStepManually = vi.fn();
    renderWithProviders(
      <NewCollectionKnifeForm
        setNewKnifeObjOnSubmit={vi.fn()}
        setFormNotReadyOnChange={vi.fn()}
        setStepManually={setStepManually}
        collectionKnifeObj={makeCollectionKnifeObj()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Gallery" }));
    expect(setStepManually).toHaveBeenCalledWith("2");
  });
});
