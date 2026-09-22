import { describe, it, expect, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../../test/testStore";
import UserProfileBanner from "./UserProfileBanner";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("UserProfileBanner", () => {
  it("renders nothing but the gradient placeholder when there is no banner", () => {
    const store = makeTestStore(null, makeProfile({ bannerImg: "" }));
    const { container } = renderWithProviders(<UserProfileBanner />, store as any);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("renders an img for a static image banner", () => {
    const store = makeTestStore(null, makeProfile({ bannerImg: "https://bucket.s3.amazonaws.com/banner.jpg" }));
    const { container } = renderWithProviders(<UserProfileBanner />, store as any);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://bucket.s3.amazonaws.com/banner.jpg");
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("renders a video element for a video banner", () => {
    const store = makeTestStore(null, makeProfile({ bannerImg: "https://bucket.s3.amazonaws.com/banner.mp4" }));
    const { container } = renderWithProviders(<UserProfileBanner />, store as any);
    expect(container.querySelector("video")).toHaveAttribute("src", "https://bucket.s3.amazonaws.com/banner.mp4");
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("navigates to the profile-banner editor when clicked", () => {
    const store = makeTestStore(null, makeProfile({ bannerImg: "" }));
    const { container } = renderWithProviders(<UserProfileBanner />, store as any);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(mockNavigate).toHaveBeenCalledWith("/configure/profile-banner");
  });
});
