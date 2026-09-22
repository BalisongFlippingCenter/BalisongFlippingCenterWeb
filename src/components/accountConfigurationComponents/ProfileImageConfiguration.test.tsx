import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import ProfileImageConfiguration from "./ProfileImageConfiguration";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderPage() {
  const store = makeTestStore("tok", makeProfile());
  setStore(store as any);
  return renderWithProviders(<ProfileImageConfiguration />, store as any);
}

function selectFile() {
  const file = new File(["content"], "avatar.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("ProfileImageConfiguration", () => {
  it("disables Save Profile Image until a file is selected", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Save Profile Image" })).toBeDisabled();
    selectFile();
    expect(screen.getByRole("button", { name: "Save Profile Image" })).not.toBeDisabled();
  });

  it("submits the file as multipart form data and updates the store on success", async () => {
    authMock.onPost("/accounts/me/update-profile-img").reply(200, "new-avatar-key");
    const { store } = renderPage();
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Save Profile Image" }));

    await waitFor(() => expect(store.getState().auth.user?.profileImg).toBe("new-avatar-key"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("shows an error on failure without navigating", async () => {
    authMock.onPost("/accounts/me/update-profile-img").reply(500);
    renderPage();
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Save Profile Image" }));

    await screen.findByText("Something went wrong. Please try again.");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
