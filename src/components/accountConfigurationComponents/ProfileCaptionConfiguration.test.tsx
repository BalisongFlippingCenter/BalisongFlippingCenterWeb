import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import ProfileCaptionConfiguration from "./ProfileCaptionConfiguration";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderPage(caption = "Old caption") {
  const store = makeTestStore("tok", makeProfile({ profileCaption: caption }));
  setStore(store as any);
  return renderWithProviders(<ProfileCaptionConfiguration />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("ProfileCaptionConfiguration", () => {
  it("disables submission when the caption is unchanged", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Save Caption" })).toBeDisabled();
  });

  it("enables submission once the caption changes, and allows clearing it entirely", () => {
    renderPage();
    const textarea = screen.getByPlaceholderText("Write something about yourself...");
    fireEvent.change(textarea, { target: { value: "New caption" } });
    expect(screen.getByRole("button", { name: "Save Caption" })).not.toBeDisabled();
    fireEvent.change(textarea, { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Save Caption" })).not.toBeDisabled();
  });

  it("rejects input beyond the 150-character limit", () => {
    renderPage("");
    const textarea = screen.getByPlaceholderText("Write something about yourself...") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "a".repeat(150) } });
    expect(textarea.value).toHaveLength(150);
    fireEvent.change(textarea, { target: { value: "a".repeat(151) } });
    expect(textarea.value).toHaveLength(150);
  });

  it("rejects input beyond 8 lines", () => {
    renderPage("");
    const textarea = screen.getByPlaceholderText("Write something about yourself...") as HTMLTextAreaElement;
    const eightLines = Array(8).fill("line").join("\n");
    fireEvent.change(textarea, { target: { value: eightLines } });
    expect(textarea.value).toBe(eightLines);
    fireEvent.change(textarea, { target: { value: eightLines + "\nline9" } });
    expect(textarea.value).toBe(eightLines);
  });

  it("shows a low-remaining-characters warning under 20 characters left", () => {
    renderPage("");
    const textarea = screen.getByPlaceholderText("Write something about yourself...");
    fireEvent.change(textarea, { target: { value: "a".repeat(140) } });
    expect(screen.getByText("10 left")).toHaveClass("text-gold");
  });

  it("on success, updates the store, toasts, and navigates back", async () => {
    authMock.onPost("/accounts/me/update-bio").reply(200);
    const { store } = renderPage();
    fireEvent.change(screen.getByPlaceholderText("Write something about yourself..."), { target: { value: "New caption" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Caption" }));

    await waitFor(() => expect(store.getState().auth.user?.profileCaption).toBe("New caption"));
    expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "success" });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("shows an error and toasts on failure without navigating", async () => {
    authMock.onPost("/accounts/me/update-bio").reply(500);
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Write something about yourself..."), { target: { value: "New caption" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Caption" }));

    await screen.findByText("Something went wrong. Please try again.");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
