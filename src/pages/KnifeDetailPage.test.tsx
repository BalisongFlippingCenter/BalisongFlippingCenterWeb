import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore, makeProfile } from "../test/testStore";
import { KnifeDetail, KnifeVersion, KnifeVariant } from "../api/catalogApi";
import KnifeDetailPage from "./KnifeDetailPage";

vi.mock("../components/FeedPostCard", () => ({
  default: ({ post }: any) => <div>feedcard:{post.id}</div>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function makeVariant(overrides: Partial<KnifeVariant> = {}): KnifeVariant {
  return {
    variantSlug: "trainer",
    type: "TRAINER",
    label: "Trainer",
    msrp: 200,
    bladeStyle: "SPEAR_POINT",
    bladeMaterial: null,
    imageUrl: null,
    ...overrides,
  };
}

function makeVersion(overrides: Partial<KnifeVersion> = {}): KnifeVersion {
  return {
    versionSlug: "v1",
    versionLabel: "V1",
    discontinued: false,
    releaseYear: 2020,
    description: "A great knife.",
    overallLength: 9,
    weight: 4,
    pivotSystem: null,
    latchType: null,
    pinSystem: null,
    hasModularBalance: false,
    balanceValue: null,
    handleConstruction: null,
    handleMaterial: null,
    handleFinish: null,
    variants: [makeVariant()],
    whereToFind: [],
    ...overrides,
  };
}

function makeKnife(overrides: Partial<KnifeDetail> = {}): KnifeDetail {
  return {
    slug: "widget",
    name: "Widget",
    makerName: "Acme Knives",
    makerSlug: "acme",
    bladeStyleSummary: "Spear Point",
    priceRangeSummary: "$150–200",
    coverPhotoUrl: null,
    description: null,
    versions: [makeVersion()],
    ...overrides,
  };
}

function mockPostsEmpty() {
  plainMock.onGet("/posts/any").reply(200, { content: [], totalPages: 1 });
}

function renderPage(path = "/product-world/knife/widget", userOverrides: any = {}) {
  const store = makeTestStore("tok", makeProfile(userOverrides));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/product-world/knife/:knifeSlug" element={<KnifeDetailPage />} />
          <Route path="/product-world/knife/:knifeSlug/:version" element={<KnifeDetailPage />} />
          <Route path="/product-world/knife/:knifeSlug/:version/:variant" element={<KnifeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("KnifeDetailPage — loading/error", () => {
  it("shows a spinner while loading", () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(() => new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("shows a not-found state on a failed fetch, with a back link", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(500);
    renderPage();
    await screen.findByText("Knife not found");
    fireEvent.click(screen.getByText("← Back to Product World"));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world");
  });
});

describe("KnifeDetailPage — header and specs", () => {
  it("renders name, maker, and formatted specs (USD/imperial default)", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife());
    mockPostsEmpty();
    renderPage();

    await screen.findByText("Widget");
    expect(screen.getByText(/by Acme Knives/)).toBeInTheDocument();
    expect(screen.getAllByText("$200.00")).toHaveLength(2); // MSRP shown in meta row + spec card
    expect(screen.getByText('9.0"')).toBeInTheDocument(); // overall length
    expect(screen.getByText("4.00oz")).toBeInTheDocument(); // weight
  });

  it("formats specs in the viewer's metric/EUR preferences", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife());
    mockPostsEmpty();
    renderPage("/product-world/knife/widget", { currency: "EUR", measurementUnit: "metric" });

    await screen.findByText("Widget");
    expect(screen.getAllByText("€184.00")).toHaveLength(2);
    expect(screen.getByText("22.9cm")).toBeInTheDocument();
    expect(screen.getByText("113.4g")).toBeInTheDocument();
  });

  it("shows an in-production banner for a non-discontinued version", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife());
    mockPostsEmpty();
    renderPage();
    await screen.findByText(/In Production — V1/);
  });

  it("shows a discontinued banner for a discontinued version", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife({
      versions: [makeVersion({ discontinued: true })],
    }));
    mockPostsEmpty();
    renderPage();
    await screen.findByText(/Discontinued — V1/);
  });

  it("renders mapped enum labels for blade style", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife());
    mockPostsEmpty();
    renderPage();
    await screen.findByText("Widget");
    expect(screen.getByText("Spear Point")).toBeInTheDocument();
  });

  it("navigates to the maker's page when the maker link is clicked", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife());
    mockPostsEmpty();
    renderPage();
    await screen.findByText("Widget");
    fireEvent.click(screen.getByText(/by Acme Knives/));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world/maker/acme");
  });
});

describe("KnifeDetailPage — version/variant resolution", () => {
  it("defaults to the first non-discontinued version and its trainer variant", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife({
      versions: [
        makeVersion({ versionSlug: "old", versionLabel: "Old", discontinued: true }),
        makeVersion({ versionSlug: "new", versionLabel: "New", discontinued: false }),
      ],
    }));
    mockPostsEmpty();
    renderPage();
    await screen.findByText(/In Production — New/);
  });

  it("selects the version from the URL param when present", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife({
      versions: [
        makeVersion({ versionSlug: "v1", versionLabel: "V1" }),
        makeVersion({ versionSlug: "v2", versionLabel: "V2" }),
      ],
    }));
    mockPostsEmpty();
    renderPage("/product-world/knife/widget/v2/trainer");
    await screen.findByText(/In Production — V2/);
  });

  it("switching versions navigates to that version's default variant route", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife({
      versions: [
        makeVersion({ versionSlug: "v1", versionLabel: "V1" }),
        makeVersion({ versionSlug: "v2", versionLabel: "V2" }),
      ],
    }));
    mockPostsEmpty();
    renderPage();
    await screen.findByText(/In Production — V1/);
    fireEvent.click(screen.getByText("V2"));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world/knife/widget/v2/trainer");
  });

  it("switching to Live Blade variant navigates and updates the displayed spec", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife({
      versions: [makeVersion({
        variants: [
          makeVariant({ variantSlug: "trainer", type: "TRAINER", label: "Trainer", msrp: 200 }),
          makeVariant({ variantSlug: "live", type: "LIVE_BLADE", label: "Live Blade", msrp: 250 }),
        ],
      })],
    }));
    mockPostsEmpty();
    renderPage();
    await screen.findByText("Widget");
    fireEvent.click(screen.getByText("Live Blade"));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world/knife/widget/v1/live");
  });

  it("shows multiple live-blade sub-variant buttons when more than one exists", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife({
      versions: [makeVersion({
        variants: [
          makeVariant({ variantSlug: "trainer", type: "TRAINER", label: "Trainer" }),
          makeVariant({ variantSlug: "damascus", type: "LIVE_BLADE", label: "Damascus" }),
          makeVariant({ variantSlug: "stonewash", type: "LIVE_BLADE", label: "Stonewash" }),
        ],
      })],
    }));
    mockPostsEmpty();
    renderPage("/product-world/knife/widget/v1/damascus");
    await screen.findByText("Damascus");
    expect(screen.getByText("Stonewash")).toBeInTheDocument();
  });
});

describe("KnifeDetailPage — where to find", () => {
  it("renders where-to-find entries with the right type tag and link", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife({
      versions: [makeVersion({
        whereToFind: [
          { label: "Acme Store", url: "https://acme.example/buy", type: "OFFICIAL", note: null },
          { label: "Some Shop", url: null, type: "RETAILER", note: "Occasionally in stock." },
        ],
      })],
    }));
    mockPostsEmpty();
    renderPage();

    await screen.findByText("Acme Store");
    expect(screen.getByText("Acme Store").closest("a")).toHaveAttribute("href", "https://acme.example/buy");
    expect(screen.getByText("Official")).toBeInTheDocument();
    expect(screen.getByText("Some Shop")).toBeInTheDocument();
    expect(screen.getByText("Occasionally in stock.")).toBeInTheDocument();
    expect(screen.getByText("Retailer")).toBeInTheDocument();
  });
});

describe("KnifeDetailPage — community posts", () => {
  it("renders posts fetched by the knife name", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife());
    plainMock.onGet("/posts/any").reply((config) => {
      expect(config.params).toMatchObject({ search: "Widget" });
      return [200, { content: [{ id: "1", postType: "GENERIC" }], totalPages: 1 }];
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("feedcard:1")).toBeInTheDocument());
  });

  it("shows an empty state when there are no posts", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife());
    mockPostsEmpty();
    renderPage();
    await screen.findByText("No community posts found for this knife yet.");
  });

  it("shows an error state with a retry button on fetch failure", async () => {
    plainMock.onGet("/catalog/any/knives/widget").reply(200, makeKnife());
    plainMock.onGet("/posts/any").reply(500);
    renderPage();
    await screen.findByText("Failed to load posts.");
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });
});
