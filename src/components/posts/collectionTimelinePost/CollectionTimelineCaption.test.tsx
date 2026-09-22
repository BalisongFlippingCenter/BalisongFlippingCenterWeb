import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CollectionTimelineCaption from "./CollectionTimelineCaption";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("CollectionTimelineCaption", () => {
  it("renders the knife display name inside the caption text", () => {
    render(
      <MemoryRouter initialEntries={["/someuser/1234/collection"]}>
        <Routes>
          <Route path="/:account/:identifier/collection" element={<CollectionTimelineCaption knifeDisplayName="My Benchmade 51" />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("My Benchmade 51")).toBeInTheDocument();
  });

  it("navigates to the knife's detail page when the name is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/someuser/1234/collection"]}>
        <Routes>
          <Route path="/:account/:identifier/collection" element={<CollectionTimelineCaption knifeDisplayName="My Benchmade 51" />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("My Benchmade 51"));
    expect(mockNavigate).toHaveBeenCalledWith("/someuser/1234/collection/My Benchmade 51");
  });
});
