import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import CollectionBannerConfiguration from "./CollectionBannerConfiguration";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderBanner() {
  const store = makeTestStore("tok");
  setStore(store as any);
  return renderWithProviders(<CollectionBannerConfiguration />, store as any);
}

function selectFile() {
  const file = new File(["content"], "banner.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("CollectionBannerConfiguration", () => {
  it("disables Save Banner until a file is selected", () => {
    renderBanner();
    expect(screen.getByRole("button", { name: "Save Banner" })).toBeDisabled();
    selectFile();
    expect(screen.getByRole("button", { name: "Save Banner" })).not.toBeDisabled();
  });

  it("submits to the collection banner endpoint and updates the collection in the store", async () => {
    authMock.onPost("/collection/me/update-banner-img").reply(200, {
      id: "col-1",
      userId: "u1",
      bannerImg: "new-banner-key",
      featuredKnifeId: null,
      collectedKnives: [],
    });
    const { store } = renderBanner();
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Save Banner" }));

    await waitFor(() => expect(store.getState().collection.collection?.bannerImg).toBe("new-banner-key"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("shows an error on failure without navigating", async () => {
    authMock.onPost("/collection/me/update-banner-img").reply(500);
    renderBanner();
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Save Banner" }));

    await screen.findByText("Something went wrong. Please try again.");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
