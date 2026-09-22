import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import { CollectionTimelinePostModal } from "../../modals/Post";
import CollectionPost from "./CollectionPost";

const timelinePost: CollectionTimelinePostModal = {
  id: "post-1",
  accountId: "acc-1",
  creationDate: "2024-01-01",
  collectionKnifeCoverPhoto: "https://bucket.s3.amazonaws.com/cover.jpg",
  collectionKnifeDisplayName: "My Benchmade 51",
  galleryFiles: [],
  postType: "COLLECTION_TIMELINE",
  postTags: [],
};

describe("CollectionPost", () => {
  it("renders a CollectionTimelinePost for a COLLECTION_TIMELINE post", () => {
    renderWithProviders(<CollectionPost post={timelinePost} />);
    expect(screen.getByText(/My Benchmade 51/)).toBeInTheDocument();
  });

  it("falls back to a plain postType label for any other post type", () => {
    renderWithProviders(<CollectionPost post={{ ...timelinePost, postType: "SOMETHING_ELSE" }} />);
    expect(screen.getByText("SOMETHING_ELSE")).toBeInTheDocument();
  });
});
