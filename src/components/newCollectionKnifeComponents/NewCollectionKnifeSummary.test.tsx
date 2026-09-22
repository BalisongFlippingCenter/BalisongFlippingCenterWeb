import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { CollectionKnifeDTO } from "../../modals/CollectionKnife";
import NewCollectionKnifeSummary from "./NewCollectionKnifeSummary";

function makeKnifeObj(overrides: Partial<CollectionKnifeDTO> = {}): CollectionKnifeDTO {
  return {
    id: null,
    displayName: "My Knife",
    knifeMaker: "Benchmade",
    baseKnifeModel: "51",
    knifeType: "liveblade",
    isFavoriteKnife: false,
    isFavoriteFlipper: false,
    aqquiredDate: "2024-01-01",
    coverPhoto: null as any,
    coverPhotoFileName: "",
    msrp: "200",
    overallLength: "9",
    weight: "4",
    pivotSystem: "Unknown",
    latchType: "Unknown",
    pinSystem: "Unknown",
    hasModularBalance: false,
    balanceValue: null,
    bladeStyle: "Unknown",
    bladeFinish: "Unknown",
    bladeMaterial: "Unknown",
    handleConstruction: "Unknown",
    handleMaterial: "Unknown",
    handleFinish: "Unknown",
    averageScore: null,
    qualityScore: 5,
    flippingScore: 5,
    feelScore: 5,
    soundScore: 5,
    durabilityScore: 5,
    ...overrides,
  } as CollectionKnifeDTO;
}

function renderSummary(
  newKnifeObj: CollectionKnifeDTO,
  galleryFiles: File[] | null = null,
  setStepManually = vi.fn(),
  userOverrides = {},
) {
  const store = makeTestStore(null, makeProfile(userOverrides));
  renderWithProviders(
    <NewCollectionKnifeSummary newKnifeObj={newKnifeObj} galleryFiles={galleryFiles} setStepManually={setStepManually} />,
    store as any,
  );
  return { setStepManually };
}

describe("NewCollectionKnifeSummary — balance point label", () => {
  it.each([
    ["0", "Heavy Blade Bias"],
    ["3", "Nuetral"],
    ["6", "Heavy Handle Bias"],
  ])("maps balanceValue %s to %s", (val, label) => {
    renderSummary(makeKnifeObj({ balanceValue: Number(val) }));
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("shows Modular instead of a balance point label when hasModularBalance is true", () => {
    renderSummary(makeKnifeObj({ hasModularBalance: true, balanceValue: 3 }));
    expect(screen.getByText("Modular")).toBeInTheDocument();
  });

  it("shows a placeholder for an unrecognized/unset balance value", () => {
    renderSummary(makeKnifeObj({ balanceValue: null }));
    expect(screen.getByText("---")).toBeInTheDocument();
  });
});

describe("NewCollectionKnifeSummary — formatted stats", () => {
  it("formats MSRP, weight, and length using the viewer's preferences", () => {
    renderSummary(makeKnifeObj({ msrp: "100", weight: "1", overallLength: "1" }), null, vi.fn(), {
      currency: "EUR",
      measurementUnit: "metric",
    });
    expect(screen.getByText("€92.00")).toBeInTheDocument();
    expect(screen.getByText("28.3g")).toBeInTheDocument();
    expect(screen.getByText("2.5cm")).toBeInTheDocument();
  });
});

describe("NewCollectionKnifeSummary — favorites and rankings", () => {
  it("shows favorite badges only when set", () => {
    renderSummary(makeKnifeObj({ isFavoriteKnife: true, isFavoriteFlipper: false }));
    expect(screen.getByText("★ Favorite Knife")).toBeInTheDocument();
    expect(screen.queryByText("♦ Favorite Flipper")).not.toBeInTheDocument();
  });

  it("hides the Rankings section when averageScore is null", () => {
    renderSummary(makeKnifeObj({ averageScore: null }));
    expect(screen.queryByText("Rankings")).not.toBeInTheDocument();
  });

  it("shows the Rankings section with the rounded average when set", () => {
    renderSummary(makeKnifeObj({ averageScore: 7.456 }));
    expect(screen.getByText("Rankings")).toBeInTheDocument();
    expect(screen.getByText("7.5")).toBeInTheDocument();
  });
});

describe("NewCollectionKnifeSummary — gallery section", () => {
  it("hides the gallery card when there are no gallery files", () => {
    renderSummary(makeKnifeObj(), null);
    expect(screen.queryByText("Gallery")).not.toBeInTheDocument();
  });

  it("shows the gallery card with one thumbnail per file", () => {
    renderSummary(makeKnifeObj(), [new File(["a"], "a.jpg"), new File(["b"], "b.jpg")]);
    expect(screen.getByText("Gallery")).toBeInTheDocument();
  });
});

describe("NewCollectionKnifeSummary — navigation", () => {
  it("Edit on the knife card jumps back to step 1", () => {
    const { setStepManually } = renderSummary(makeKnifeObj());
    fireEvent.click(screen.getAllByRole("button", { name: /Edit/ })[0]);
    expect(setStepManually).toHaveBeenCalledWith("1");
  });

  it("Edit on the gallery card jumps back to step 2", () => {
    const { setStepManually } = renderSummary(makeKnifeObj(), [new File(["a"], "a.jpg")]);
    fireEvent.click(screen.getAllByRole("button", { name: /Edit/ })[1]);
    expect(setStepManually).toHaveBeenCalledWith("2");
  });

  it("Submit Knife jumps to step 4", () => {
    const { setStepManually } = renderSummary(makeKnifeObj());
    fireEvent.click(screen.getByRole("button", { name: "Submit Knife →" }));
    expect(setStepManually).toHaveBeenCalledWith("4");
  });
});
