import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import { CollectionKnife } from "../../modals/CollectionKnife";
import UsersCollectionKnifeDisplay from "./UsersCollectionKnifeDisplay";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

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

function renderPage(knives: CollectionKnife[], routeName = "My Benchmade", featuredKnifeId: string | null = null) {
  const store = makeTestStore("tok", makeProfile({ displayName: "someuser", identifierCode: "1234" }));
  setStore(store as any);
  store.dispatch(
    setCollection({
      id: "col-1",
      userId: "u1",
      bannerImg: null,
      featuredKnifeId,
      collectedKnives: knives,
    }),
  );
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/collection/${routeName}`]}>
        <Routes>
          <Route path="/collection/:knife" element={<UsersCollectionKnifeDisplay />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("UsersCollectionKnifeDisplay — loading/lookup", () => {
  it("shows Knife not found when no knife matches the route param", () => {
    renderPage([makeKnife({ displayName: "Other Knife" })]);
    expect(screen.getByText("Knife not found.")).toBeInTheDocument();
  });

  it("renders the knife's view mode when found", () => {
    renderPage([makeKnife()]);
    expect(screen.getByRole("button", { name: /Edit/ })).toBeInTheDocument();
  });
});

describe("UsersCollectionKnifeDisplay — entering/leaving edit mode", () => {
  it("entering edit mode prefills the display name field", () => {
    renderPage([makeKnife()]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.getByPlaceholderText("e.g. My Benchmade 51")).toHaveValue("My Benchmade");
    expect(screen.getByText("Editing — My Benchmade")).toBeInTheDocument();
  });

  it("Cancel exits edit mode without making any request", () => {
    renderPage([makeKnife()]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
    expect(screen.queryByPlaceholderText("e.g. My Benchmade 51")).not.toBeInTheDocument();
    expect(authMock.history.put.length).toBe(0);
  });
});

describe("UsersCollectionKnifeDisplay — duplicate name validation", () => {
  it("flags a name that collides with another knife in the collection and disables Save", () => {
    renderPage([makeKnife({ id: "1", displayName: "My Benchmade" }), makeKnife({ id: "2", displayName: "Taken Name" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.change(screen.getByPlaceholderText("e.g. My Benchmade 51"), { target: { value: "Taken Name" } });

    expect(screen.getByText("Name already in use")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Save/ })[0]).toBeDisabled();
  });

  it("does not flag the knife's own unchanged name as a duplicate", () => {
    renderPage([makeKnife({ id: "1", displayName: "My Benchmade" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.queryByText("Name already in use")).not.toBeInTheDocument();
  });
});

describe("UsersCollectionKnifeDisplay — save", () => {
  it("saves successfully and exits edit mode without navigating when the name is unchanged", async () => {
    authMock.onPut("/collection/me/update-knife/1").reply(200, {
      id: "1",
      displayName: "My Benchmade",
      qualityScore: 9,
    });
    const store = renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Save/ })[0]);

    await waitFor(() => expect(screen.queryByText(/Editing —/)).not.toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(store.getState().collection.collectionKnives[0].qualityScore).toBe(9);
  });

  it("navigates to the updated URL when the display name changed", async () => {
    authMock.onPut("/collection/me/update-knife/1").reply(200, {
      id: "1",
      displayName: "Renamed Knife",
    });
    renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.change(screen.getByPlaceholderText("e.g. My Benchmade 51"), { target: { value: "Renamed Knife" } });
    fireEvent.click(screen.getAllByRole("button", { name: /^Save/ })[0]);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/someuser/1234/collection/Renamed Knife", { replace: true }),
    );
  });

  it("shows a specific error on a 409 name conflict from the server", async () => {
    authMock.onPut("/collection/me/update-knife/1").reply(409);
    renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Save/ })[0]);
    await screen.findByText("That display name is already taken.");
  });

  it("shows a generic error on any other failure", async () => {
    authMock.onPut("/collection/me/update-knife/1").reply(500);
    renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Save/ })[0]);
    await screen.findByText("Failed to save. Please try again.");
  });
});

describe("UsersCollectionKnifeDisplay — delete", () => {
  it("requires confirmation before deleting", () => {
    renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove from Collection" }));
    expect(screen.getByText('Remove "My Benchmade" from your collection?')).toBeInTheDocument();
    expect(authMock.history.delete.length).toBe(0);
  });

  it("deletes the knife and navigates to the collection page on confirm", async () => {
    authMock.onDelete("/collection/me/remove-knife/1").reply(200);
    const store = renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove from Collection" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, Remove" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/someuser/1234/collection", { replace: true }));
    expect(store.getState().collection.collectionKnives).toHaveLength(0);
  });

  it("shows a specific error when the knife doesn't belong to the user (409)", async () => {
    authMock.onDelete("/collection/me/remove-knife/1").reply(409);
    renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove from Collection" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, Remove" }));
    await screen.findByText("This knife doesn't belong to your collection.");
  });

  it("Cancel on the confirmation step backs out without deleting", () => {
    renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove from Collection" }));
    const confirmBox = screen.getByText('Remove "My Benchmade" from your collection?').closest("div.bg-red\\/5")!;
    fireEvent.click(within(confirmBox as HTMLElement).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Remove from Collection" })).toBeInTheDocument();
  });
});

describe("UsersCollectionKnifeDisplay — featured toggle", () => {
  it("sets the knife as featured when not currently featured", async () => {
    authMock.onPost("/collection/me/set-featured-knife/1").reply(200, {
      id: "col-1",
      userId: "u1",
      bannerImg: null,
      featuredKnifeId: "1",
      collectedKnives: [makeKnife({ id: "1" })],
    });
    const store = renderPage([makeKnife({ id: "1" })]);
    fireEvent.click(screen.getByRole("button", { name: /Set as Featured/ }));
    await waitFor(() => expect(store.getState().collection.collection?.featuredKnifeId).toBe("1"));
  });

  it("clears the featured knife when already featured", async () => {
    authMock.onPost("/collection/me/clear-featured-knife").reply(200, {
      id: "col-1",
      userId: "u1",
      bannerImg: null,
      featuredKnifeId: null,
      collectedKnives: [makeKnife({ id: "1" })],
    });
    const store = renderPage([makeKnife({ id: "1" })], "My Benchmade", "1");
    fireEvent.click(screen.getByRole("button", { name: /Remove as Featured/ }));
    await waitFor(() => expect(store.getState().collection.collection?.featuredKnifeId).toBeNull());
  });
});
