import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { CollectionKnifeDTO } from "../../modals/CollectionKnife";
import NewCollectionKnifeSubmit from "./NewCollectionKnifeSubmit";

vi.mock("../../api/directUpload", () => ({
  uploadKnifeGalleryMediaDirect: vi.fn(),
}));
import { uploadKnifeGalleryMediaDirect } from "../../api/directUpload";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

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
    coverPhoto: new File(["x"], "cover.png") as any,
    coverPhotoFileName: "cover.png",
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
    averageScore: 5,
    qualityScore: 5,
    flippingScore: 5,
    feelScore: 5,
    soundScore: 5,
    durabilityScore: 5,
    ...overrides,
  } as CollectionKnifeDTO;
}

function renderSubmit(props: { galleryFiles: File[] | null; newKnifeObj: CollectionKnifeDTO | null }) {
  const store = makeTestStore("tok", makeProfile({ displayName: "someuser", identifierCode: "1234" }));
  setStore(store as any);
  return renderWithProviders(<NewCollectionKnifeSubmit {...props} setStepManually={vi.fn()} />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
  vi.mocked(uploadKnifeGalleryMediaDirect).mockReset();
});

describe("NewCollectionKnifeSubmit", () => {
  it("shows the uploading state, then success, and adds the knife to the store", async () => {
    authMock.onPost("/collection/me/add-knife").reply(200, { id: "1", displayName: "My Knife" });
    const { store } = renderSubmit({ galleryFiles: null, newKnifeObj: makeKnifeObj() });

    expect(screen.getByText("Uploading")).toBeInTheDocument();
    await screen.findByText("Knife Added!");
    expect(store.getState().collection.collection?.collectedKnives).toHaveLength(1);
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success" });
  });

  it("skips the gallery upload step when there are no gallery files", async () => {
    authMock.onPost("/collection/me/add-knife").reply(200, { id: "1", displayName: "My Knife" });
    renderSubmit({ galleryFiles: null, newKnifeObj: makeKnifeObj() });
    await screen.findByText("Knife Added!");
    expect(uploadKnifeGalleryMediaDirect).not.toHaveBeenCalled();
  });

  it("uploads gallery files first and includes the resulting URLs in the submission", async () => {
    vi.mocked(uploadKnifeGalleryMediaDirect).mockResolvedValue([
      { key: "k1", uploadUrl: "u1", publicUrl: "https://cdn/1.jpg", isVideo: false },
      { key: "k2", uploadUrl: "u2", publicUrl: "https://cdn/2.jpg", isVideo: false },
    ]);
    authMock.onPost("/collection/me/add-knife").reply((config) => {
      const fd = config.data as FormData;
      expect(fd.getAll("galleryUrls")).toEqual(["https://cdn/1.jpg", "https://cdn/2.jpg"]);
      return [200, { id: "1", displayName: "My Knife" }];
    });
    const file = new File(["x"], "gallery.jpg");
    renderSubmit({ galleryFiles: [file], newKnifeObj: makeKnifeObj() });
    await screen.findByText("Knife Added!");
    expect(uploadKnifeGalleryMediaDirect).toHaveBeenCalledWith("My Knife", [file]);
  });

  it("shows the failure state and toasts an error when the gallery upload fails, without submitting the knife", async () => {
    vi.mocked(uploadKnifeGalleryMediaDirect).mockRejectedValue(new Error("upload failed"));
    const { store } = renderSubmit({ galleryFiles: [new File(["x"], "g.jpg")], newKnifeObj: makeKnifeObj() });

    await screen.findByText("Upload Failed");
    expect(authMock.history.post.length).toBe(0);
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error" });
  });

  it("shows the failure state when the main submission request fails", async () => {
    authMock.onPost("/collection/me/add-knife").reply(500);
    const { store } = renderSubmit({ galleryFiles: null, newKnifeObj: makeKnifeObj() });
    await screen.findByText("Upload Failed");
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error" });
  });

  it("View Collection navigates to the user's collection page", async () => {
    authMock.onPost("/collection/me/add-knife").reply(200, { id: "1", displayName: "My Knife" });
    renderSubmit({ galleryFiles: null, newKnifeObj: makeKnifeObj() });
    await screen.findByText("Knife Added!");
    fireEvent.click(screen.getByRole("button", { name: "View Collection" }));
    expect(mockNavigate).toHaveBeenCalledWith("/someuser/1234/collection");
  });

  it("sends optional fields as JSON-stringified booleans/numbers in the form data", async () => {
    authMock.onPost("/collection/me/add-knife").reply((config) => {
      const fd = config.data as FormData;
      expect(fd.get("isFavoriteKnife")).toBe("true");
      expect(fd.get("qualityScore")).toBe("5");
      return [200, { id: "1", displayName: "My Knife" }];
    });
    renderSubmit({ galleryFiles: null, newKnifeObj: makeKnifeObj({ isFavoriteKnife: true }) });
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });
});
