import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { CollectionTimelinePostModal } from "../../../modals/Post";
import CollectionTimelinePost from "./CollectionTimelinePost";

const basePost: CollectionTimelinePostModal = {
  id: "post-1",
  accountId: "acc-1",
  creationDate: "2024-01-01",
  collectionKnifeCoverPhoto: "https://bucket.s3.amazonaws.com/cover.jpg",
  collectionKnifeDisplayName: "My Benchmade 51",
  galleryFiles: ["https://bucket.s3.amazonaws.com/gallery1.jpg"],
  postType: "COLLECTION_TIMELINE",
  postTags: [],
};

describe("CollectionTimelinePost", () => {
  it("renders the post type, caption, and creation date", () => {
    renderWithProviders(<CollectionTimelinePost post={basePost} />);
    expect(screen.getByText("COLLECTION_TIMELINE")).toBeInTheDocument();
    expect(screen.getByText("My Benchmade 51")).toBeInTheDocument();
    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
  });

  it("renders a labeled tag for each recognized postTag", () => {
    renderWithProviders(<CollectionTimelinePost post={{ ...basePost, postTags: ["NEW_KNIFE", "GRAIL", "FAV_FLIPPER"] }} />);
    expect(screen.getByText("New Knife")).toBeInTheDocument();
    expect(screen.getByText("Grail")).toBeInTheDocument();
    expect(screen.getByText("Fav Flipper")).toBeInTheDocument();
  });

  it("renders no tag label for an unrecognized tag", () => {
    renderWithProviders(<CollectionTimelinePost post={{ ...basePost, postTags: ["SOMETHING_UNKNOWN"] }} />);
    expect(screen.queryByText("New Knife")).not.toBeInTheDocument();
    expect(screen.queryByText("Grail")).not.toBeInTheDocument();
  });
});
