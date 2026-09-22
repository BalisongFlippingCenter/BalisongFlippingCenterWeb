import { describe, it, expect, vi } from "vitest";
import { screen, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { makeTestStore, makeProfile } from "../test/testStore";

vi.mock("../components/collectionPageComponents/UsersCollectionPageComponent", () => ({
  default: () => <div data-testid="users-collection-page-component" />,
}));
vi.mock("../components/collectionPageComponents/PublicCollectionPageComponent", () => ({
  default: ({ displayName, identifierCode }: { displayName: string; identifierCode: string }) => (
    <div data-testid="public-collection-page-component">{displayName}/{identifierCode}</div>
  ),
}));

import UserCollectionPage from "./UserCollectionPage";

function renderAt(path: string, accessToken: string | null, profile: any) {
  const store = makeTestStore(accessToken, profile);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:account/:identifier/collection" element={<UserCollectionPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("UserCollectionPage", () => {
  it("shows the owner's editable collection when account and identifier both match", () => {
    renderAt("/someuser/1234/collection", "tok", makeProfile({ displayName: "someuser", identifierCode: "1234" }));
    expect(screen.getByTestId("users-collection-page-component")).toBeInTheDocument();
  });

  it("shows the public collection when the identifier doesn't match", () => {
    renderAt("/someuser/9999/collection", "tok", makeProfile({ displayName: "someuser", identifierCode: "1234" }));
    expect(screen.getByTestId("public-collection-page-component")).toHaveTextContent("someuser/9999");
  });

  it("shows the public collection when no user is logged in", () => {
    renderAt("/someuser/1234/collection", null, null);
    expect(screen.getByTestId("public-collection-page-component")).toHaveTextContent("someuser/1234");
  });
});
