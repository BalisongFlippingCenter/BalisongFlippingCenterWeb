import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import { PostPreview as PostPreviewModal } from "../modals/Post";
import PostPreviewComponent from "./PostPreview";

vi.mock("./ProfileImgDisplay", () => ({ default: () => <div data-testid="profile-img-display" /> }));
vi.mock("./PostFilesDisplay", () => ({ default: () => <div data-testid="post-files-display" /> }));

const basePost: PostPreviewModal = {
  id: "post-1",
  caption: "",
  description: "",
  creatorName: "user1",
  creationDate: "2024-01-01",
  files: [],
  likes: 3,
  identifer: "",
  isAnnouncement: false,
  isPrivatePost: false,
  hasTimer: false,
  timeInHours: "",
};

describe("PostPreview", () => {
  it("renders the creator name and like count", () => {
    renderWithProviders(<PostPreviewComponent postObj={basePost} />);
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("3 likes")).toBeInTheDocument();
  });

  it("shows an Announcement label for an announcement post", () => {
    renderWithProviders(<PostPreviewComponent postObj={{ ...basePost, isAnnouncement: true }} />);
    expect(screen.getByText("Announcement")).toBeInTheDocument();
  });

  it("shows a Private Annoucement label when both announcement and private are true", () => {
    renderWithProviders(<PostPreviewComponent postObj={{ ...basePost, isAnnouncement: true, isPrivatePost: true }} />);
    expect(screen.getByText("Private Annoucement")).toBeInTheDocument();
  });

  it("shows a Private label for a private, non-announcement post", () => {
    renderWithProviders(<PostPreviewComponent postObj={{ ...basePost, isPrivatePost: true }} />);
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("renders the identifier and caption when present", () => {
    renderWithProviders(<PostPreviewComponent postObj={{ ...basePost, identifer: "Buy/Sell", caption: "For sale!" }} />);
    expect(screen.getByText("Buy/Sell")).toBeInTheDocument();
    expect(screen.getByText("For sale!")).toBeInTheDocument();
  });

  it("does not render PostFilesDisplay when there are no files", () => {
    renderWithProviders(<PostPreviewComponent postObj={basePost} />);
    expect(screen.queryByTestId("post-files-display")).not.toBeInTheDocument();
  });

  it("renders PostFilesDisplay when files are present", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    renderWithProviders(<PostPreviewComponent postObj={{ ...basePost, files: [file] }} />);
    expect(screen.getByTestId("post-files-display")).toBeInTheDocument();
  });

  it("renders the description when present", () => {
    renderWithProviders(<PostPreviewComponent postObj={{ ...basePost, description: "Some details" }} />);
    expect(screen.getByText("Some details")).toBeInTheDocument();
  });
});
