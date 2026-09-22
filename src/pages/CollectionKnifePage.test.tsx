import { describe, it, expect } from "vitest";
import { screen, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { makeTestStore, makeProfile } from "../test/testStore";
import { setCollection } from "../redux/collection/collectionSlice";
import { CollectionKnife } from "../modals/CollectionKnife";

vi.mock("../components/collectionKnifePageComponents/UsersCollectionKnifeDisplay", () => ({
  default: () => <div data-testid="users-collection-knife-display" />,
}));
vi.mock("../components/collectionKnifePageComponents/CollectionKnifeDisplay", () => ({
  default: () => <div data-testid="collection-knife-display" />,
}));

import CollectionKnifePage from "./CollectionKnifePage";

function renderAt(path: string, accessToken: string | null, profile: any, knives: CollectionKnife[] = []) {
  const store = makeTestStore(accessToken, profile);
  store.dispatch(setCollection({ id: "col-1", userId: "u1", bannerImg: null, featuredKnifeId: null, collectedKnives: knives }));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:account/:identifier/collection/:knife" element={<CollectionKnifePage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("CollectionKnifePage", () => {
  it("shows the owner's editable view when account, identifier, and knife all match the logged-in user", () => {
    const knives = [{ id: "1", displayName: "My Benchmade" } as unknown as CollectionKnife];
    renderAt(
      "/someuser/1234/collection/My Benchmade",
      "tok",
      makeProfile({ displayName: "someuser", identifierCode: "1234" }),
      knives,
    );
    expect(screen.getByTestId("users-collection-knife-display")).toBeInTheDocument();
  });

  it("shows the public view when the viewer is not the owner", () => {
    const knives = [{ id: "1", displayName: "My Benchmade" } as unknown as CollectionKnife];
    renderAt(
      "/otheruser/9999/collection/My Benchmade",
      "tok",
      makeProfile({ displayName: "someuser", identifierCode: "1234" }),
      knives,
    );
    expect(screen.getByTestId("collection-knife-display")).toBeInTheDocument();
  });

  it("shows the public view when the knife isn't found in the owner's collection", () => {
    renderAt(
      "/someuser/1234/collection/Nonexistent Knife",
      "tok",
      makeProfile({ displayName: "someuser", identifierCode: "1234" }),
      [],
    );
    expect(screen.getByTestId("collection-knife-display")).toBeInTheDocument();
  });

  it("shows the public view when no user is logged in", () => {
    renderAt("/someuser/1234/collection/My Benchmade", null, null, []);
    expect(screen.getByTestId("collection-knife-display")).toBeInTheDocument();
  });
});
