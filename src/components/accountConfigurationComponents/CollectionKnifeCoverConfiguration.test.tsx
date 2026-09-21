import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import { CollectionKnife } from "../../modals/CollectionKnife";
import CollectionKnifeCoverConfiguration from "./CollectionKnifeCoverConfiguration";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderCover(props: Partial<React.ComponentProps<typeof CollectionKnifeCoverConfiguration>> = {}) {
  const store = makeTestStore("tok");
  setStore(store as any);
  store.dispatch(
    setCollection({
      id: "col-1",
      userId: "u1",
      bannerImg: null,
      featuredKnifeId: null,
      collectedKnives: [{ id: "knife-1", displayName: "My Knife" } as unknown as CollectionKnife],
    }),
  );
  return renderWithProviders(
    <CollectionKnifeCoverConfiguration
      knifeId="knife-1"
      currentCoverPhoto={null}
      displayName="My Knife"
      galleryImages={["https://cdn/a.jpg", "https://cdn/b.jpg"]}
      {...props}
    />,
    store as any,
  );
}

function selectUploadFile() {
  const file = new File(["content"], "cover.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("CollectionKnifeCoverConfiguration", () => {
  it("disables the submit button until a file or gallery image is selected", () => {
    renderCover();
    const submit = screen.getByRole("button", { name: /Save Cover Photo/ });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByAltText("gallery 0"));
    expect(submit).not.toBeDisabled();
  });

  it("selecting a gallery image clears a previously selected file", () => {
    renderCover();
    selectUploadFile();
    expect(screen.getByAltText("preview")).toBeInTheDocument();

    fireEvent.click(screen.getByAltText("gallery 0"));
    expect(screen.queryByAltText("preview")).not.toBeInTheDocument();
  });

  it("selecting a file clears a previously selected gallery image", () => {
    renderCover();
    fireEvent.click(screen.getByAltText("gallery 0"));
    selectUploadFile();
    // the selected-gallery highlight ring is removed once cleared
    expect(screen.getByAltText("gallery 0").className).not.toContain("border-blue-primary");
  });

  it("clicking the same gallery image again deselects it", () => {
    renderCover();
    const submit = screen.getByRole("button", { name: /Save Cover Photo/ });
    fireEvent.click(screen.getByAltText("gallery 0"));
    expect(submit).not.toBeDisabled();
    fireEvent.click(screen.getByAltText("gallery 0"));
    expect(submit).toBeDisabled();
  });

  it("shows the no-gallery-photos message when galleryImages is empty", () => {
    renderCover({ galleryImages: [] });
    expect(screen.getByText("No gallery photos yet")).toBeInTheDocument();
  });

  it("submits the uploaded file and updates the knife in the store", async () => {
    authMock.onPost("/collection/me/update-knife/knife-1/cover-photo").reply((config) => {
      const fd = config.data as FormData;
      expect(fd.has("file")).toBe(true);
      return [200, { id: "knife-1", displayName: "My Knife", coverPhoto: "new-cover-key" }];
    });
    const { store } = renderCover();
    selectUploadFile();
    fireEvent.click(screen.getByRole("button", { name: /Save Cover Photo/ }));

    await waitFor(() =>
      expect(store.getState().collection.collectionKnives.find((k) => k.id === "knife-1")?.coverPhoto).toBe(
        "new-cover-key",
      ),
    );
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("submits the selected gallery URL as existingUrl instead of a file", async () => {
    authMock.onPost("/collection/me/update-knife/knife-1/cover-photo").reply((config) => {
      const fd = config.data as FormData;
      expect(fd.has("file")).toBe(false);
      expect(fd.get("existingUrl")).toBe("https://cdn/a.jpg");
      return [200, { id: "knife-1", displayName: "My Knife", coverPhoto: "https://cdn/a.jpg" }];
    });
    renderCover();
    fireEvent.click(screen.getByAltText("gallery 0"));
    fireEvent.click(screen.getByRole("button", { name: /Save Cover Photo/ }));
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });

  it("shows an error on failure without navigating", async () => {
    authMock.onPost("/collection/me/update-knife/knife-1/cover-photo").reply(500);
    renderCover();
    fireEvent.click(screen.getByAltText("gallery 0"));
    fireEvent.click(screen.getByRole("button", { name: /Save Cover Photo/ }));
    await screen.findByText("Something went wrong. Please try again.");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
