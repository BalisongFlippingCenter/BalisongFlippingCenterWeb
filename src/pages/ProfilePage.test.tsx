import { describe, it, expect, vi } from "vitest";
import { screen, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { makeTestStore, makeProfile } from "../test/testStore";

vi.mock("../components/profilePageComponents/UserProfilePage", () => ({
  default: () => <div data-testid="user-profile-page" />,
}));
vi.mock("../components/profilePageComponents/ProfilePageDisplay", () => ({
  default: ({ displayName, identifierCode }: { displayName: string; identifierCode: string }) => (
    <div data-testid="profile-page-display">{displayName}/{identifierCode}</div>
  ),
}));

import ProfilePage from "./ProfilePage";

function renderAt(path: string, accessToken: string | null, profile: any) {
  const store = makeTestStore(accessToken, profile);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:account/:identifier" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("ProfilePage", () => {
  it("shows the owner's editable view when account and identifier both match the logged-in user", () => {
    renderAt("/someuser/1234", "tok", makeProfile({ displayName: "someuser", identifierCode: "1234" }));
    expect(screen.getByTestId("user-profile-page")).toBeInTheDocument();
  });

  it("shows the public view when the identifier doesn't match, even if the display name does", () => {
    renderAt("/someuser/9999", "tok", makeProfile({ displayName: "someuser", identifierCode: "1234" }));
    expect(screen.getByTestId("profile-page-display")).toHaveTextContent("someuser/9999");
  });

  it("shows the public view when no user is logged in", () => {
    renderAt("/someuser/1234", null, null);
    expect(screen.getByTestId("profile-page-display")).toHaveTextContent("someuser/1234");
  });
});
