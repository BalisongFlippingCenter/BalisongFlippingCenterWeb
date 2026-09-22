import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import ProfileImageDisplay from "./ProfileImageDisplay";

describe("ProfileImageDisplay", () => {
  it("shows an error placeholder when the user has no profile image", () => {
    const store = makeTestStore(null, makeProfile({ profileImg: "" }));
    renderWithProviders(<ProfileImageDisplay />, store as any);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("shows an error placeholder when there is no logged-in user", () => {
    renderWithProviders(<ProfileImageDisplay />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders the user's profile image when present", () => {
    const store = makeTestStore(null, makeProfile({ profileImg: "https://bucket.s3.amazonaws.com/pic.jpg" }));
    const { container } = renderWithProviders(<ProfileImageDisplay />, store as any);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://bucket.s3.amazonaws.com/pic.jpg");
  });
});
