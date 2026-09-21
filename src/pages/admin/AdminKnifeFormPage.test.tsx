import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import AdminKnifeFormPage from "./AdminKnifeFormPage";

const mockNavigate = vi.fn();
let mockParams: { slug?: string } = {};
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => mockParams };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

const MAKERS = [{ slug: "acme", name: "Acme Knives", country: "USA", logoUrl: null }];

function makeKnifeData(overrides: Partial<any> = {}) {
  return {
    slug: "krake-raken",
    name: "Krake Raken",
    makerName: "Acme Knives",
    makerSlug: "acme",
    coverPhotoUrl: "https://cdn/cover.jpg",
    description: "A knife.",
    versions: [
      {
        versionSlug: "v3",
        versionLabel: "V3",
        discontinued: false,
        releaseYear: 2020,
        description: "third version",
        overallLength: 10.5,
        weight: 4.19,
        pivotSystem: "BUSHINGS",
        latchType: "SPRING_LATCH",
        pinSystem: "ZEN_PINS",
        hasModularBalance: true,
        balanceValue: "2g",
        handleConstruction: "SANDWHICH",
        handleMaterial: "TITANIUM",
        handleFinish: "STONE_WASH",
        variants: [
          {
            variantSlug: "tanto",
            type: "LIVE_BLADE",
            label: "Tanto",
            msrp: 200,
            bladeStyle: "TANTO",
            bladeMaterial: "M390",
            imageUrl: "https://cdn/tanto.jpg",
          },
        ],
        whereToFind: [
          { label: "Official Store", url: "https://acme.example/buy", type: "OFFICIAL", note: "" },
        ],
      },
    ],
    ...overrides,
  };
}

function renderPage(makers: typeof MAKERS = MAKERS) {
  const store = makeTestStore("tok", makeProfile({ role: "ADMIN" }));
  setStore(store as any);
  authMock.onGet("/catalog/any/makers").reply(200, makers);
  return renderWithProviders(<AdminKnifeFormPage />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
  mockParams = {};
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdminKnifeFormPage — create mode", () => {
  it("loads makers, shows an empty form with no versions", async () => {
    renderPage();
    await screen.findByText("New Knife");
    expect(screen.getByText("Select a maker...")).toBeInTheDocument();
    await screen.findByText("Acme Knives");
    expect(screen.getByText("No versions yet.")).toBeInTheDocument();
  });

  it("disables submit until slug, name, and maker are set", async () => {
    renderPage();
    await screen.findByText("Acme Knives");
    const submit = screen.getByText("Create Knife");
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("krake-raken"), { target: { value: "new-knife" } });
    fireEvent.change(screen.getByPlaceholderText("Krake Raken"), { target: { value: "New Knife" } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByDisplayValue("Select a maker..."), { target: { value: "acme" } });
    expect(submit).not.toBeDisabled();
  });

  it("shows a hint to create a maker first when there are no makers", async () => {
    renderPage([]);
    await screen.findByText("New Knife");
    await screen.findByText(/create one first/);
  });

  it("adds and removes a version, and adds/removes a variant within it", async () => {
    renderPage();
    await screen.findByText("Acme Knives");

    fireEvent.click(screen.getByText("Add Version"));
    expect(screen.getByText("Version 1")).toBeInTheDocument();
    expect(screen.getByText("Variant 1")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add Variant"));
    expect(screen.getByText("Variant 2")).toBeInTheDocument();

    const trashButtons = document.querySelectorAll(".fa-trash");
    // Last trash icon in DOM order belongs to the most recently added variant.
    fireEvent.click(trashButtons[trashButtons.length - 1].closest("button")!);
    expect(screen.queryByText("Variant 2")).not.toBeInTheDocument();
  });

  it("submits a create request including versions/variants and navigates on success", async () => {
    authMock.onPost("/admin/catalog/knives").reply(200);
    renderPage();
    await screen.findByText("Acme Knives");

    fireEvent.change(screen.getByPlaceholderText("krake-raken"), { target: { value: "new-knife" } });
    fireEvent.change(screen.getByPlaceholderText("Krake Raken"), { target: { value: "New Knife" } });
    fireEvent.change(screen.getByDisplayValue("Select a maker..."), { target: { value: "acme" } });
    fireEvent.click(screen.getByText("Create Knife"));

    await waitFor(() => expect(authMock.history.post.filter((r) => r.url === "/admin/catalog/knives").length).toBe(1));
    const body = JSON.parse(authMock.history.post.find((r) => r.url === "/admin/catalog/knives")!.data);
    expect(body).toMatchObject({ slug: "new-knife", name: "New Knife", makerSlug: "acme", versions: [] });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin/catalog"));
  });
});

describe("AdminKnifeFormPage — edit mode", () => {
  beforeEach(() => {
    mockParams = { slug: "krake-raken" };
  });

  it("populates knife, version, and variant fields from the fetched knife, mapping enums to labels", async () => {
    authMock.onGet("/catalog/any/knives/krake-raken").reply(200, makeKnifeData());
    renderPage();

    await screen.findByDisplayValue("Krake Raken");
    expect(screen.getByPlaceholderText("krake-raken")).toBeDisabled();
    expect(screen.getByText("Edit Krake Raken")).toBeInTheDocument();
    expect(screen.getByDisplayValue("V3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bushings")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Spring Latch")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Zen Pins")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sandwhich")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Titanium")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Stonewash")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("label")[0]).toHaveValue("Tanto");
    expect(screen.getByDisplayValue("M390")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Official Store")).toBeInTheDocument();
  });

  it("BUG: a handleConstruction of CHANNEL maps to a label with no matching dropdown option", async () => {
    // catalogEnumLabels.ts maps CHANNEL -> "Channel", but comboBoxData/HandleConstruction.ts
    // only offers the (misspelled) "Chanel" as an option — so an existing knife with this
    // value shows the dropdown blank on edit, and re-saving without touching it would send
    // the wrong "Channel" string instead of the value everywhere else in the app uses.
    authMock.onGet("/catalog/any/knives/krake-raken").reply(200, makeKnifeData({
      versions: [{ ...makeKnifeData().versions[0], handleConstruction: "CHANNEL" }],
    }));
    renderPage();

    await screen.findByDisplayValue("Krake Raken");
    expect(screen.queryByDisplayValue("Channel")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Chanel")).not.toBeInTheDocument();
    // Falls back to the blank "—" placeholder option instead of any real value.
    expect(screen.getAllByDisplayValue("—").length).toBeGreaterThan(0);
  });

  it("submits an update request with edited fields and navigates on success", async () => {
    authMock.onGet("/catalog/any/knives/krake-raken").reply(200, makeKnifeData());
    authMock.onPut("/admin/catalog/knives/krake-raken").reply(200);
    renderPage();

    await screen.findByDisplayValue("Krake Raken");
    fireEvent.change(screen.getByDisplayValue("Krake Raken"), { target: { value: "Krake Raken V3" } });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => expect(authMock.history.put.length).toBe(1));
    const body = JSON.parse(authMock.history.put[0].data);
    expect(body).toMatchObject({ slug: "krake-raken", name: "Krake Raken V3", makerSlug: "acme" });
    expect(body.versions[0]).toMatchObject({ versionSlug: "v3", pivotSystem: "Bushings" });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin/catalog"));
  });

  it("shows an error toast and preserves form state when the save fails", async () => {
    authMock.onGet("/catalog/any/knives/krake-raken").reply(200, makeKnifeData());
    authMock.onPut("/admin/catalog/knives/krake-raken").reply(500, "Bad data");
    const { store } = renderPage();

    await screen.findByDisplayValue("Krake Raken");
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Bad data" }));
    expect(mockNavigate).not.toHaveBeenCalledWith("/admin/catalog");
    expect(screen.getByDisplayValue("Krake Raken")).toBeInTheDocument();
  });
});

describe("AdminKnifeFormPage — image upload", () => {
  beforeEach(() => {
    mockParams = { slug: "krake-raken" };
  });

  it("uploads the cover photo and stores the returned public URL", async () => {
    authMock.onGet("/catalog/any/knives/krake-raken").reply(200, makeKnifeData({ coverPhotoUrl: "" }));
    authMock.onPost("/admin/catalog/upload-url").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toMatchObject({ knifeSlug: "krake-raken", filename: "cover.jpg" });
      return [200, { key: "k1", uploadUrl: "https://s3/put-cover", publicUrl: "https://cdn/new-cover.jpg", isVideo: false }];
    });
    vi.spyOn(axios, "put").mockResolvedValue({ status: 200 } as any);

    renderPage();
    await screen.findByDisplayValue("Krake Raken");

    const file = new File(["x"], "cover.jpg", { type: "image/jpeg" });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    await waitFor(() => expect(document.querySelector("img")).toHaveAttribute("src", "https://cdn/new-cover.jpg"));
  });
});
