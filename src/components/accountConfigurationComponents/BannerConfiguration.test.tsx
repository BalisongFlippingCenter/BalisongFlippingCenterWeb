import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import BannerConfiguration from "./BannerConfiguration";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderBanner(userOverrides = {}) {
  const store = makeTestStore("tok", makeProfile(userOverrides));
  setStore(store as any);
  return renderWithProviders(<BannerConfiguration />, store as any);
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

describe("BannerConfiguration", () => {
  it("disables Save Banner until a file is selected", () => {
    renderBanner();
    expect(screen.getByRole("button", { name: "Save Banner" })).toBeDisabled();
    selectFile();
    expect(screen.getByRole("button", { name: "Save Banner" })).not.toBeDisabled();
  });

  it("shows a preview of the selected image", () => {
    renderBanner();
    selectFile();
    const img = document.querySelector("img") as HTMLImageElement;
    expect(img.src).toBe("blob:mock-url");
  });

  it("submits the file as multipart form data and updates the store on success", async () => {
    authMock.onPost("/accounts/me/update-banner-img").reply((config) => {
      expect(config.headers?.["Content-Type"]).toBe("multipart/form-data");
      expect(config.data).toBeInstanceOf(FormData);
      return [200, "new-banner-key"];
    });
    const { store } = renderBanner();
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Save Banner" }));

    await waitFor(() => expect(store.getState().auth.user?.bannerImg).toBe("new-banner-key"));
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success", message: "Profile banner updated!" });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("shows an error and toasts on failure, without navigating", async () => {
    authMock.onPost("/accounts/me/update-banner-img").reply(500);
    const { store } = renderBanner();
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Save Banner" }));

    await screen.findByText("Something went wrong. Please try again.");
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error" });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
