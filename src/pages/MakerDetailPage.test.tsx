import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import { MakerDetail } from "../api/catalogApi";
import MakerDetailPage from "./MakerDetailPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const plainMock = new MockAdapter(axiosApiInstance);

function makeMaker(overrides: Partial<MakerDetail> = {}): MakerDetail {
  return {
    slug: "acme",
    name: "Acme Knives",
    country: "USA",
    knownFor: "Precision-milled balisongs.",
    officialSiteUrl: null,
    logoUrl: null,
    foundedYear: 1998,
    instagramUrl: null,
    youtubeUrl: null,
    facebookUrl: null,
    twitterUrl: null,
    knives: [],
    ...overrides,
  };
}

function renderPage(slug = "acme") {
  const store = makeTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/product-world/maker/${slug}`]}>
        <Routes>
          <Route path="/product-world/maker/:makerSlug" element={<MakerDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  plainMock.reset();
  mockNavigate.mockReset();
});

describe("MakerDetailPage — loading/error", () => {
  it("shows a spinner while loading", () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(() => new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("shows a not-found state on a failed fetch, with a back link", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(500);
    renderPage();
    await screen.findByText("Maker not found");
    fireEvent.click(screen.getByText("← Back to Product World"));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world");
  });
});

describe("MakerDetailPage — details", () => {
  it("renders name, country, and founded year", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(200, makeMaker());
    renderPage();
    await screen.findByText("Acme Knives");
    expect(screen.getByText("USA")).toBeInTheDocument();
    expect(screen.getByText("Est. 1998")).toBeInTheDocument();
    expect(screen.getByText("Precision-milled balisongs.")).toBeInTheDocument();
  });

  it("omits the country/founded badges when not provided", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(200, makeMaker({ country: null, foundedYear: null }));
    renderPage();
    await screen.findByText("Acme Knives");
    expect(screen.queryByText(/^Est\./)).not.toBeInTheDocument();
  });

  it("renders the official site link when set", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(200, makeMaker({ officialSiteUrl: "https://acme.example" }));
    renderPage();
    await screen.findByText("Official Site");
    expect(screen.getByText("Official Site").closest("a")).toHaveAttribute("href", "https://acme.example");
  });

  it("renders social links with the correct FontAwesome classes (deprecated icon aliases)", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(200, makeMaker({
      instagramUrl: "https://instagram.com/acme",
      youtubeUrl: "https://youtube.com/acme",
      facebookUrl: "https://facebook.com/acme",
      twitterUrl: "https://twitter.com/acme",
    }));
    renderPage();
    await screen.findByText("Acme Knives");

    expect(document.querySelector(".fa-instagram")).not.toBeNull();
    expect(document.querySelector(".fa-square-youtube")).not.toBeNull();
    expect(document.querySelector(".fa-square-facebook")).not.toBeNull();
    expect(document.querySelector(".fa-square-twitter")).not.toBeNull();

    expect(document.querySelector(".fa-instagram")!.closest("a")).toHaveAttribute("href", "https://instagram.com/acme");
  });

  it("hides the links row entirely when there are no links", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(200, makeMaker());
    renderPage();
    await screen.findByText("Acme Knives");
    expect(screen.queryByText("Official Site")).not.toBeInTheDocument();
    expect(document.querySelector(".fa-instagram")).toBeNull();
  });
});

describe("MakerDetailPage — knives list", () => {
  it("shows an empty state when the maker has no knives", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(200, makeMaker({ knives: [] }));
    renderPage();
    await screen.findByText("No knives listed for this maker yet.");
  });

  it("renders knives and navigates to a knife's detail page on click", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(200, makeMaker({
      knives: [
        { slug: "widget-1", name: "Widget", makerName: "Acme Knives", makerSlug: "acme", bladeStyleSummary: "Spear Point", handleMaterialSummary: "G-10", priceRangeSummary: "$100–150", coverPhotoUrl: null, hasActiveVersion: true },
      ],
    }));
    renderPage();
    await screen.findByText("Widget");
    fireEvent.click(screen.getByText("Widget"));
    expect(mockNavigate).toHaveBeenCalledWith("/product-world/knife/widget-1");
  });

  it("marks a knife without an active version as Discontinued", async () => {
    plainMock.onGet("/catalog/any/makers/acme").reply(200, makeMaker({
      knives: [
        { slug: "widget-1", name: "Widget", makerName: "Acme Knives", makerSlug: "acme", bladeStyleSummary: "", handleMaterialSummary: "", priceRangeSummary: null, coverPhotoUrl: null, hasActiveVersion: false },
      ],
    }));
    renderPage();
    await screen.findByText("Discontinued");
  });
});
