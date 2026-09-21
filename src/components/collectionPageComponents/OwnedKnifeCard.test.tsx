import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { CollectionKnife } from "../../modals/CollectionKnife";
import OwnedKnifeCard from "./OwnedKnifeCard";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeKnife(overrides: Partial<CollectionKnife> = {}): CollectionKnife {
  return {
    id: "1",
    displayName: "My Knife",
    knifeMaker: "Benchmade",
    baseKnifeModel: "51",
    coverPhoto: "",
    favoriteKnife: false,
    averageScore: null,
    msrp: "200",
    ...overrides,
  } as unknown as CollectionKnife;
}

function renderCard(props: Partial<React.ComponentProps<typeof OwnedKnifeCard>> = {}, userOverrides = {}) {
  const store = makeTestStore("tok", makeProfile({ displayName: "someuser", identifierCode: "1234", ...userOverrides }));
  return renderWithProviders(<OwnedKnifeCard knife={makeKnife()} {...props} />, store as any);
}

describe("OwnedKnifeCard — navigation", () => {
  it("navigates to the viewer's own collection knife page by default", () => {
    renderCard();
    fireEvent.click(screen.getByText("My Knife"));
    expect(mockNavigate).toHaveBeenCalledWith("/someuser/1234/collection/My Knife");
  });

  it("navigates using the overridden owner when viewing someone else's collection", () => {
    renderCard({ ownerDisplayName: "otheruser", ownerIdentifierCode: "9999" });
    fireEvent.click(screen.getByText("My Knife"));
    expect(mockNavigate).toHaveBeenCalledWith("/otheruser/9999/collection/My Knife");
  });
});

describe("OwnedKnifeCard — badges", () => {
  it("shows the favorite star for a favorited knife (boolean true)", () => {
    renderCard({ knife: makeKnife({ favoriteKnife: true }) });
    expect(document.querySelector(".fa-star")).not.toBeNull();
  });

  it("shows the favorite star for a favorited knife (string 'true')", () => {
    renderCard({ knife: makeKnife({ favoriteKnife: "true" as unknown as boolean }) });
    expect(document.querySelector(".fa-star")).not.toBeNull();
  });

  it("hides the favorite star when not favorited", () => {
    renderCard({ knife: makeKnife({ favoriteKnife: false, averageScore: null }) });
    expect(document.querySelector(".fa-star")).toBeNull();
  });

  it("shows the rounded average score when set", () => {
    renderCard({ knife: makeKnife({ averageScore: 8.456 }) });
    expect(screen.getByText("8.5")).toBeInTheDocument();
  });

  it("hides the score badge when averageScore is null", () => {
    renderCard({ knife: makeKnife({ averageScore: null, favoriteKnife: false }) });
    expect(document.querySelector(".fa-star")).toBeNull();
  });
});

describe("OwnedKnifeCard — details", () => {
  it("shows maker and model joined together", () => {
    renderCard({ knife: makeKnife({ knifeMaker: "Benchmade", baseKnifeModel: "51" }) });
    expect(screen.getByText("Benchmade · 51")).toBeInTheDocument();
  });

  it("formats the MSRP using the viewer's currency preference", () => {
    renderCard({ knife: makeKnife({ msrp: "100" }) }, { currency: "EUR" });
    expect(screen.getByText("€92.00")).toBeInTheDocument();
  });

  it("hides the MSRP entirely when it can't be formatted", () => {
    renderCard({ knife: makeKnife({ msrp: "" }) });
    expect(screen.queryByText(/\$|€/)).not.toBeInTheDocument();
  });
});
