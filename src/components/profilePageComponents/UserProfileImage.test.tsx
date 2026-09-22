import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import UserProfileImage from "./UserProfileImage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("UserProfileImage", () => {
  it("shows a camera placeholder when the user has no profile image", () => {
    const store = makeTestStore(null, makeProfile({ profileImg: "" }));
    const { container } = renderWithProviders(<UserProfileImage />, store as any);
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("renders the user's profile image when present", () => {
    const store = makeTestStore(null, makeProfile({ profileImg: "https://bucket.s3.amazonaws.com/pic.jpg" }));
    const { container } = renderWithProviders(<UserProfileImage />, store as any);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://bucket.s3.amazonaws.com/pic.jpg");
  });

  it("navigates to the profile image editor when clicked", () => {
    const store = makeTestStore(null, makeProfile({ profileImg: "" }));
    const { container } = renderWithProviders(<UserProfileImage />, store as any);
    fireEvent.click(container.firstChild!.firstChild as HTMLElement);
    expect(mockNavigate).toHaveBeenCalledWith("/configure/profile-image");
  });
});
