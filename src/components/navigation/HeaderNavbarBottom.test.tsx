import { describe, it, expect } from "vitest";
import { screen, render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { makeTestStore, makeProfile } from "../../test/testStore";
import { setTotalUnread } from "../../redux/messages/messagesSlice";
import HeaderNavbarBottom from "./HeaderNavbarBottom";

function renderNav(path: string, unread = 0) {
  const store = makeTestStore("tok", makeProfile({ displayName: "someuser", identifierCode: "1234" }));
  store.dispatch(setTotalUnread(unread));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<HeaderNavbarBottom />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

function isTabActive(label: string): boolean {
  const link = screen.getByText(label).closest("a")!;
  return link.querySelector(".bg-\\[\\#111318\\]") !== null;
}

describe("HeaderNavbarBottom — active tab", () => {
  it("marks Profile active on the viewer's own profile path", () => {
    renderNav("/someuser/1234");
    expect(isTabActive("Profile")).toBe(true);
    expect(isTabActive("Collection")).toBe(false);
  });

  it("marks Collection active on the viewer's collection path", () => {
    renderNav("/someuser/1234/collection");
    expect(isTabActive("Collection")).toBe(true);
  });

  it("marks Messages active on any /messages sub-path", () => {
    renderNav("/messages/conv-1");
    expect(isTabActive("Messages")).toBe(true);
  });

  it("marks Create active on /create-post", () => {
    renderNav("/create-post");
    const createLink = screen.getByText("Create").closest("a")!;
    expect(createLink.querySelector(".bg-blue-primary")).toBeInTheDocument();
  });

  it("marks nothing active on an unrelated route", () => {
    renderNav("/community");
    expect(isTabActive("Profile")).toBe(false);
    expect(isTabActive("Collection")).toBe(false);
    expect(isTabActive("Messages")).toBe(false);
  });
});

describe("HeaderNavbarBottom — unread badge", () => {
  it("hides the badge with no unread messages", () => {
    renderNav("/community", 0);
    expect(document.querySelector(".min-w-\\[16px\\]")).toBeNull();
  });

  it("shows the unread count", () => {
    renderNav("/community", 7);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("caps the badge at 99+", () => {
    renderNav("/community", 250);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
