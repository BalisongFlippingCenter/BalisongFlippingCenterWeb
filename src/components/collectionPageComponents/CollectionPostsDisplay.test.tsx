import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../../api/axios";
import { renderWithProviders } from "../../test/renderWithProviders";
import { makeTestStore } from "../../test/testStore";
import { setCollection } from "../../redux/collection/collectionSlice";
import CollectionPostsDisplay from "./CollectionPostsDisplay";

const plainMock = new MockAdapter(axiosApiInstance);

function renderWithCollectionId(id: string) {
  const store = makeTestStore();
  store.dispatch(setCollection({ id, userId: "u1", bannerImg: null, featuredKnifeId: null, collectedKnives: [] }));
  return renderWithProviders(<CollectionPostsDisplay />, store as any);
}

beforeEach(() => {
  plainMock.reset();
});

describe("CollectionPostsDisplay", () => {
  it("shows an empty state when there are no posts", async () => {
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, []);
    renderWithCollectionId("col-1");
    await screen.findByText("No activity yet.");
  });

  it("shows an empty state when the request fails", async () => {
    plainMock.onGet("/collection/any/col-1/get-posts").reply(500);
    renderWithCollectionId("col-1");
    await screen.findByText("No activity yet.");
  });

  it("renders each returned post", async () => {
    plainMock.onGet("/collection/any/col-1/get-posts").reply(200, [
      {
        id: "p1",
        accountId: "acc-1",
        creationDate: "2024-01-01",
        collectionKnifeCoverPhoto: "https://bucket.s3.amazonaws.com/cover.jpg",
        collectionKnifeDisplayName: "My Benchmade 51",
        galleryFiles: [],
        postType: "COLLECTION_TIMELINE",
        postTags: [],
      },
    ]);
    renderWithCollectionId("col-1");
    await screen.findByText(/My Benchmade 51/);
    expect(screen.queryByText("No activity yet.")).not.toBeInTheDocument();
  });

  it("requests posts scoped to the current collection's id", async () => {
    plainMock.onGet("/collection/any/col-42/get-posts").reply(200, []);
    renderWithCollectionId("col-42");
    await waitFor(() => expect(plainMock.history.get.some((c) => c.url === "/collection/any/col-42/get-posts")).toBe(true));
  });
});
