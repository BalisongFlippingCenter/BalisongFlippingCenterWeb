import { describe, it, expect, vi } from "vitest";
import { screen, render } from "@testing-library/react";
import UserProfilePage from "./UserProfilePage";

vi.mock("./UserProfileData", () => ({ default: () => <div data-testid="user-profile-data" /> }));
vi.mock("../UserProfilePostsComponent", () => ({ default: () => <div data-testid="user-profile-posts" /> }));
vi.mock("./UserProfileBanner", () => ({ default: () => <div data-testid="user-profile-banner" /> }));
vi.mock("./UserProfileImage", () => ({ default: () => <div data-testid="user-profile-image" /> }));

describe("UserProfilePage", () => {
  it("composes the banner, image, data, and posts sections", () => {
    render(<UserProfilePage />);
    expect(screen.getByTestId("user-profile-banner")).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-image")).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-data")).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-posts")).toBeInTheDocument();
  });
});
