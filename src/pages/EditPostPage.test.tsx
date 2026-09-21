import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance, axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import { setCollection } from "../redux/collection/collectionSlice";
import { CollectionKnife } from "../modals/CollectionKnife";
import EditPostPage from "./EditPostPage";

const mockNavigate = vi.fn();
let mockParams: { postId?: string } = { postId: "42" };
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => mockParams };
});

const plainMock = new MockAdapter(axiosApiInstance);
const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeKnife(overrides: Partial<any> = {}): CollectionKnife {
  return {
    id: "1",
    displayName: "My Knife",
    knifeMaker: "Benchmade",
    baseKnifeModel: "51",
    coverPhoto: "",
    ...overrides,
  } as unknown as CollectionKnife;
}

function makePostData(overrides: Partial<any> = {}) {
  return {
    id: "42",
    postType: "BUY_SELL",
    caption: "original caption",
    description: "original description",
    mediaFiles: [],
    ...overrides,
  };
}

function renderPage(knives: CollectionKnife[] = [], featuredKnifeId: string | null = null) {
  const store = makeTestStore("tok", makeProfile());
  setStore(store as any);
  if (knives.length > 0) {
    store.dispatch(
      setCollection({ id: "col-1", userId: "u1", bannerImg: null, featuredKnifeId, collectedKnives: knives } as any),
    );
  }
  return renderWithProviders(<EditPostPage />, store as any);
}

beforeEach(() => {
  plainMock.reset();
  authMock.reset();
  mockNavigate.mockReset();
  mockParams = { postId: "42" };
});

describe("EditPostPage — loading/error", () => {
  it("shows a loading spinner while fetching", () => {
    plainMock.onGet("/posts/any/42").reply(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Edit Post")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Add a caption…")).not.toBeInTheDocument();
  });

  it("shows an error state and Go back when the fetch fails", async () => {
    plainMock.onGet("/posts/any/42").reply(500);
    renderPage();
    await screen.findByText("Failed to load post.");
    fireEvent.click(screen.getByText("Go back"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("shows an error state immediately when there is no postId param", async () => {
    mockParams = {};
    renderPage();
    await screen.findByText("Failed to load post.");
  });
});

describe("EditPostPage — populating fields", () => {
  it("populates caption, description, and post id from the fetched post", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({ caption: "hi there", description: "desc here" }));
    renderPage();
    await screen.findByDisplayValue("hi there");
    expect(screen.getByDisplayValue("desc here")).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();
  });

  it("populates the reference knife for non-generic posts", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({
      postType: "BUY_SELL",
      referenceKnife: { id: "1", displayName: "Special Knife", knifeMaker: "Benchmade", baseKnifeModel: "51" },
    }));
    renderPage([makeKnife({ id: "1", displayName: "Special Knife" })]);
    await screen.findByText("Special Knife");
  });
});

describe("EditPostPage — generic post per-file editing", () => {
  function genericPost() {
    return makePostData({
      postType: "GENERIC",
      mediaFiles: [
        { url: "https://x/1.jpg", isVideo: false, description: "first", referenceKnifeId: null, referenceKnife: null },
        { url: "https://x/2.jpg", isVideo: false, description: "second", referenceKnifeId: 1, referenceKnife: { id: "1", displayName: "Tagged Knife" } },
      ],
    });
  }

  it("shows per-image description fields and labels them by index", async () => {
    plainMock.onGet("/posts/any/42").reply(200, genericPost());
    renderPage([makeKnife({ id: "1", displayName: "Tagged Knife" })]);
    await screen.findByDisplayValue("first");
    expect(screen.getByText("Description — Image 1")).toBeInTheDocument();
  });

  it("switches the active file's description when a thumbnail tab is clicked", async () => {
    plainMock.onGet("/posts/any/42").reply(200, genericPost());
    renderPage([makeKnife({ id: "1", displayName: "Tagged Knife" })]);
    await screen.findByDisplayValue("first");

    const tabs = screen.getAllByRole("button").filter((b) => b.querySelector("img"));
    fireEvent.click(tabs[1]);

    expect(screen.getByText("Description — Image 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("second")).toBeInTheDocument();
  });

  it("sends per-file metadata as JSON on save for generic posts", async () => {
    plainMock.onGet("/posts/any/42").reply(200, genericPost());
    authMock.onPatch("/posts/42").reply(200);
    renderPage([makeKnife({ id: "1", displayName: "Tagged Knife" })]);
    await screen.findByDisplayValue("first");

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => expect(authMock.history.patch.length).toBe(1));
    const body = JSON.parse(authMock.history.patch[0].data);
    const fileMetadata = JSON.parse(body.fileMetadata);
    expect(fileMetadata).toEqual([
      { description: "first", referenceKnifeId: null },
      { description: "second", referenceKnifeId: "1" },
    ]);
    expect(body.description).toBeUndefined();
  });
});

describe("EditPostPage — non-generic post editing", () => {
  it("sends description and referenceKnifeId (not fileMetadata) on save", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({ postType: "TRADE" }));
    authMock.onPatch("/posts/42").reply(200);
    renderPage();
    await screen.findByDisplayValue("original description");

    fireEvent.change(screen.getByDisplayValue("original description"), { target: { value: "updated description" } });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => expect(authMock.history.patch.length).toBe(1));
    const body = JSON.parse(authMock.history.patch[0].data);
    expect(body).toMatchObject({ caption: "original caption", description: "updated description", referenceKnifeId: null });
    expect(body.fileMetadata).toBeUndefined();
  });

  it("trims description and sends null when it's left blank", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({ postType: "TRADE", description: "   " }));
    authMock.onPatch("/posts/42").reply(200);
    renderPage();
    await screen.findByPlaceholderText("Add a description…");

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => expect(authMock.history.patch.length).toBe(1));
    const body = JSON.parse(authMock.history.patch[0].data);
    expect(body.description).toBeNull();
  });
});

describe("EditPostPage — knife picker", () => {
  it("shows 'No knives in collection' and disables the picker when empty", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({ postType: "TRADE" }));
    renderPage([]);
    await screen.findByText("No knives in collection");
    expect(screen.getByText("No knives in collection").closest("button")).toBeDisabled();
  });

  it("opens the picker, selects a knife, and closes the picker", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({ postType: "TRADE" }));
    renderPage([makeKnife({ id: "5", displayName: "Pickable Knife" })]);
    await screen.findByText("Select a knife…");

    fireEvent.click(screen.getByText("Select a knife…"));
    fireEvent.click(screen.getByText("Pickable Knife"));

    expect(screen.getByText("Change knife…")).toBeInTheDocument();
    expect(screen.getByText("Pickable Knife")).toBeInTheDocument();
  });

  it("removes the selected knife via the Remove button", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({
      postType: "TRADE",
      referenceKnife: { id: "5", displayName: "Pickable Knife", knifeMaker: "Maker" },
    }));
    renderPage([makeKnife({ id: "5", displayName: "Pickable Knife" })]);
    await screen.findByText("Remove");

    fireEvent.click(screen.getByText("Remove"));

    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    expect(screen.getByText("Select a knife…")).toBeInTheDocument();
  });
});

describe("EditPostPage — save flow", () => {
  it("shows a success toast and navigates back on successful save", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({ postType: "TRADE" }));
    authMock.onPatch("/posts/42").reply(200);
    renderPage();
    await screen.findByDisplayValue("original caption");

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(-1));
  });

  it("shows an error message and preserves form state when the save fails", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({ postType: "TRADE" }));
    authMock.onPatch("/posts/42").reply(500);
    renderPage();
    await screen.findByDisplayValue("original caption");

    fireEvent.change(screen.getByDisplayValue("original caption"), { target: { value: "edited caption" } });
    fireEvent.click(screen.getByText("Save Changes"));

    await screen.findByText("Failed to save. Please try again.");
    expect(mockNavigate).not.toHaveBeenCalledWith(-1);
    expect(screen.getByDisplayValue("edited caption")).toBeInTheDocument();
  });

  it("cancels back without saving", async () => {
    plainMock.onGet("/posts/any/42").reply(200, makePostData({ postType: "TRADE" }));
    renderPage();
    await screen.findByDisplayValue("original caption");

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(authMock.history.patch.length).toBe(0);
  });
});
