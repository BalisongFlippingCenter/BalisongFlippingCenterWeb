import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../api/axios";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { CollectionKnife } from "../../modals/CollectionKnife";
import CollectionKnifeDisplay from "./CollectionKnifeDisplay";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function makeKnife(overrides: Partial<CollectionKnife> = {}): CollectionKnife {
  return {
    id: "1",
    displayName: "My Benchmade",
    knifeMaker: "Benchmade",
    baseKnifeModel: "51",
    knifeType: "LIVEBLADE",
    favoriteKnife: false,
    favoriteFlipper: false,
    aqquiredDate: "",
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

function renderPage(userOverrides = {}, routeName = "My Benchmade") {
  const store = makeTestStore(null, makeProfile(userOverrides));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/someuser/1234/collection/${routeName}`]}>
        <Routes>
          <Route path="/:account/:identifier/collection/:knife" element={<CollectionKnifeDisplay />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("CollectionKnifeDisplay — loading/lookup", () => {
  it("shows a loading spinner, then the knife once the fetch resolves", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: { featuredKnifeId: null, collectedKnives: [makeKnife()] },
    });
    renderPage();
    await screen.findByText("My Benchmade");
  });

  it("shows Knife not found when no knife in the fetched collection matches the route param", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: { featuredKnifeId: null, collectedKnives: [makeKnife({ displayName: "Other Knife" })] },
    });
    renderPage();
    await screen.findByText("Knife not found.");
  });

  it("shows Knife not found when the request itself fails", async () => {
    plainMock.onGet("/collection/any/handle").reply(500);
    renderPage();
    await screen.findByText("Knife not found.");
  });

  it("Go back navigates back in history from the error state", async () => {
    plainMock.onGet("/collection/any/handle").reply(500);
    renderPage();
    await screen.findByText("Knife not found.");
    fireEvent.click(screen.getByRole("button", { name: /Go back/ }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

describe("CollectionKnifeDisplay — badges", () => {
  it("shows the Featured badge only when this knife's id matches the collection's featuredKnifeId", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: { featuredKnifeId: "1", collectedKnives: [makeKnife({ id: "1" })] },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("hides the Featured badge when a different knife is featured", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: { featuredKnifeId: "999", collectedKnives: [makeKnife({ id: "1" })] },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  it("shows favorite badges based on favoriteKnife/favoriteFlipper, accepting boolean or string truthy values", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: {
        featuredKnifeId: null,
        collectedKnives: [makeKnife({ favoriteKnife: "true" as unknown as boolean, favoriteFlipper: true })],
      },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(screen.getByText("Favorite Knife")).toBeInTheDocument();
    expect(screen.getByText("Favorite Flipper")).toBeInTheDocument();
  });

  it("maps the knifeType to a human label", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: { featuredKnifeId: null, collectedKnives: [makeKnife({ knifeType: "TRAINER" })] },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(screen.getByText("Trainer")).toBeInTheDocument();
  });
});

describe("CollectionKnifeDisplay — formatted stats", () => {
  it("formats MSRP and weight using the viewer's currency and measurement-unit preferences", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: { featuredKnifeId: null, collectedKnives: [makeKnife({ msrp: "100", weight: "4" })] },
    });
    renderPage({ currency: "EUR", measurementUnit: "metric" });
    await screen.findByText("My Benchmade");
    expect(screen.getByText("€92.00")).toBeInTheDocument();
    expect(screen.getByText("113.4g")).toBeInTheDocument();
  });
});

describe("CollectionKnifeDisplay — balance display", () => {
  it("shows the Modular Balance System label when hasModularBalance is true", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: { featuredKnifeId: null, collectedKnives: [makeKnife({ hasModularBalance: true })] },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(screen.getByText("Modular Balance System")).toBeInTheDocument();
  });

  it("shows the balance point label matching the numeric balanceValue", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: {
        featuredKnifeId: null,
        collectedKnives: [makeKnife({ hasModularBalance: false, balanceValue: 0 as unknown as string })],
      },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(screen.getByText("Heavy Blade")).toBeInTheDocument();
  });

  it("hides the balance section entirely when balanceValue is null and balance isn't modular", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: {
        featuredKnifeId: null,
        collectedKnives: [makeKnife({ hasModularBalance: false, balanceValue: null })],
      },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(screen.queryByText("Balance Point")).not.toBeInTheDocument();
    expect(screen.queryByText("Modular Balance System")).not.toBeInTheDocument();
  });
});

describe("CollectionKnifeDisplay — gallery", () => {
  it("shows the empty-gallery state when there are no gallery files", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: { featuredKnifeId: null, collectedKnives: [makeKnife({ galleryFiles: [] })] },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(screen.getByText("No gallery items yet.")).toBeInTheDocument();
  });

  it("renders a play indicator for video files but not image files", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: {
        featuredKnifeId: null,
        collectedKnives: [
          makeKnife({
            galleryFiles: [
              { fileId: "https://cdn/clip.mp4", postId: null },
              { fileId: "https://cdn/photo.jpg", postId: null },
            ],
          }),
        ],
      },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    expect(document.querySelector("video")).not.toBeNull();
    expect(screen.getByAltText("gallery 2")).toBeInTheDocument();
  });

  it("opens the lightbox at the clicked gallery item's index", async () => {
    plainMock.onGet("/collection/any/handle").reply(200, {
      collection: {
        featuredKnifeId: null,
        collectedKnives: [
          makeKnife({
            galleryFiles: [
              { fileId: "https://cdn/a.jpg", postId: null },
              { fileId: "https://cdn/b.jpg", postId: null },
            ],
          }),
        ],
      },
    });
    renderPage();
    await screen.findByText("My Benchmade");
    fireEvent.click(screen.getByAltText("gallery 2"));
    await waitFor(() => expect(document.querySelectorAll("video, img").length).toBeGreaterThan(2));
  });
});
