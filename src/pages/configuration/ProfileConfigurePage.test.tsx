import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import ProfileConfigurePage from "./ProfileConfigurePage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderPage(profile = makeProfile()) {
  const store = makeTestStore("tok", profile);
  setStore(store as any);
  return renderWithProviders(<ProfileConfigurePage />, store as any);
}

beforeEach(() => {
  authMock.reset();
  mockNavigate.mockReset();
});

describe("ProfileConfigurePage — navigation rows", () => {
  it("navigates to each settings sub-page when its row is clicked", () => {
    renderPage();
    const cases: [string, string][] = [
      ["Profile Image", "/configure/profile-image"],
      ["Profile Banner", "/configure/profile-banner"],
      ["Display Name", "/configure/display_name"],
      ["Profile Caption", "/configure/profile_caption"],
      ["Collection Banner Image", "/configure/collection-banner-image"],
      ["Change Email", "/configure/email"],
      ["Change Password", "/configure/password"],
      ["Contact Us", "/about"],
      ["Terms of Service", "/terms"],
      ["Privacy Policy", "/privacy"],
    ];
    for (const [label, route] of cases) {
      fireEvent.click(screen.getByText(label));
      expect(mockNavigate).toHaveBeenCalledWith(route);
    }
  });

  it("shows Set/Not set based on whether the profile image/banner are configured", () => {
    renderPage(makeProfile({ profileImg: "https://bucket.s3.amazonaws.com/pic.jpg", bannerImg: "" }));
    expect(screen.getAllByText("Set")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Not set")[0]).toBeInTheDocument();
  });
});

describe("ProfileConfigurePage — social links accordion", () => {
  it("is collapsed by default and shows the linked count", () => {
    renderPage(makeProfile({ facebookLink: "fb.com/me", instagramLink: "ig.com/me" }));
    expect(screen.getByText("2 linked")).toBeInTheDocument();
    expect(screen.getByText("Facebook").closest('div[style*="max-height"]')).toHaveStyle({ maxHeight: "0px" });
  });

  it("expands to reveal each social row and navigates on click", () => {
    renderPage(makeProfile({ facebookLink: "fb.com/me" }));
    fireEvent.click(screen.getByText("Manage Social Links"));

    expect(screen.getByText("Facebook").closest('div[style*="max-height"]')).not.toHaveStyle({ maxHeight: "0px" });
    fireEvent.click(screen.getByText("Discord"));
    expect(mockNavigate).toHaveBeenCalledWith("/configure/discord_link");
  });
});

describe("ProfileConfigurePage — measurement/currency toggles", () => {
  it("switches measurement units and persists the change", async () => {
    authMock.onPost("accounts/me/update-preferences").reply(200);
    renderPage(makeProfile({ measurementUnit: "imperial" }));

    fireEvent.click(screen.getByRole("button", { name: "Metric" }));
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
    expect(JSON.parse(authMock.history.post[0].data)).toMatchObject({ measurementUnit: "metric" });
  });

  it("does nothing when clicking the already-active option", () => {
    renderPage(makeProfile({ currency: "USD" }));
    fireEvent.click(screen.getByRole("button", { name: "USD" }));
    expect(authMock.history.post.length).toBe(0);
  });
});

function getModal() {
  return screen.getByRole("heading", { name: /Account$/ }).closest(".max-w-md") as HTMLElement;
}

describe("ProfileConfigurePage — danger zone", () => {
  it("opens the Hide Account modal and requires a password to confirm", () => {
    renderPage();
    fireEvent.click(screen.getByText("Hide Account"));
    const modal = within(getModal());
    expect(modal.getByRole("heading", { name: "Hide Account" })).toBeInTheDocument();
    expect(modal.getByRole("button", { name: "Hide Account" })).toBeDisabled();
  });

  it("closes the modal via Cancel", () => {
    renderPage();
    fireEvent.click(screen.getByText("Hide Account"));
    fireEvent.click(within(getModal()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "Hide Account" })).not.toBeInTheDocument();
  });

  it("shows an incorrect-password message on a 401 and lets the user retry", async () => {
    authMock.onPost("accounts/me/hide-account").reply(401);
    renderPage();
    fireEvent.click(screen.getByText("Hide Account"));
    const modal = within(getModal());
    fireEvent.change(modal.getByPlaceholderText("••••••••"), { target: { value: "wrongpass" } });
    fireEvent.click(modal.getByRole("button", { name: "Hide Account" }));
    await screen.findByText("Incorrect password. Please try again.");
  });

  it("closes the modal on a successful hide", async () => {
    authMock.onPost("accounts/me/hide-account").reply(200);
    renderPage();
    fireEvent.click(screen.getByText("Hide Account"));
    const modal = within(getModal());
    fireEvent.change(modal.getByPlaceholderText("••••••••"), { target: { value: "correctpass" } });
    fireEvent.click(modal.getByRole("button", { name: "Hide Account" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Hide Account" })).not.toBeInTheDocument());
  });

  it("opens the Delete Account modal with delete-specific copy", () => {
    renderPage();
    fireEvent.click(screen.getByText("Delete Account"));
    const modal = within(getModal());
    expect(modal.getByRole("heading", { name: "Delete Account" })).toBeInTheDocument();
    expect(modal.getByRole("button", { name: "Permanently Delete" })).toBeInTheDocument();
  });

  it("issues a DELETE request for the delete-account flow", async () => {
    authMock.onDelete("accounts/me").reply(200);
    renderPage();
    fireEvent.click(screen.getByText("Delete Account"));
    const modal = within(getModal());
    fireEvent.change(modal.getByPlaceholderText("••••••••"), { target: { value: "correctpass" } });
    fireEvent.click(modal.getByRole("button", { name: "Permanently Delete" }));
    await waitFor(() => expect(authMock.history.delete.length).toBe(1));
  });
});
