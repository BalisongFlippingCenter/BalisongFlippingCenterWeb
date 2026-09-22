import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { makeTestStore } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import { CollectionKnife } from "../../modals/CollectionKnife";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("../../components/accountConfigurationComponents/CollectionKnifeCoverConfiguration", () => ({
  default: ({ displayName }: { displayName: string }) => (
    <div data-testid="collection-knife-cover-configuration">{displayName}</div>
  ),
}));

import ProfileConfigurationCollectionKnifeCoverPage from "./ProfileConfigurationCollectionKnifeCoverPage";

function makeKnife(overrides: Partial<CollectionKnife> = {}): CollectionKnife {
  return {
    id: "1",
    collectionId: 1,
    displayName: "My Benchmade",
    knifeMaker: "Benchmade",
    baseKnifeModel: "51",
    knifeType: "LIVEBLADE",
    favoriteKnife: false,
    favoriteFlipper: false,
    aqquiredDate: "2024-01-01",
    coverPhoto: "",
    galleryFiles: [],
    msrp: "200",
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
    averageScore: 8,
    qualityScore: 8,
    flippingScore: 8,
    feelScore: 8,
    soundScore: 8,
    durabilityScore: 8,
    ...overrides,
  } as unknown as CollectionKnife;
}

function renderAtKnifeId(knifeId: string, knives: CollectionKnife[]) {
  const store = makeTestStore();
  store.dispatch(setCollection({ id: "col-1", userId: "u1", bannerImg: null, featuredKnifeId: null, collectedKnives: knives }));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/configure/collection-knife-cover/${knifeId}`]}>
        <Routes>
          <Route path="/configure/collection-knife-cover/:knifeId" element={<ProfileConfigurationCollectionKnifeCoverPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("ProfileConfigurationCollectionKnifeCoverPage", () => {
  it("shows a not-found message when the knife id doesn't match any owned knife", () => {
    renderAtKnifeId("999", [makeKnife({ id: "1" })]);
    expect(screen.getByText("Knife not found.")).toBeInTheDocument();
  });

  it("renders the cover configuration for a matching knife", () => {
    renderAtKnifeId("1", [makeKnife({ id: "1", displayName: "My Benchmade" })]);
    expect(screen.getByRole("heading", { name: "Cover Photo" })).toBeInTheDocument();
    expect(screen.getByTestId("collection-knife-cover-configuration")).toHaveTextContent("My Benchmade");
  });

  it("navigates back when the back button is clicked", () => {
    renderAtKnifeId("1", [makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
