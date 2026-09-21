import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HeaderNavbar from "./HeaderNavbar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderNavbar(path = "/community") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<HeaderNavbar />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
});

describe("HeaderNavbar — active link highlighting", () => {
  it("marks the current top-level route active", () => {
    renderNavbar("/tutorial-center");
    expect(screen.getByText("Tutorial Center").closest("a")).toHaveClass("text-blue-primary");
    expect(screen.getByText("Community").closest("a")).not.toHaveClass("text-blue-primary");
  });

  it("marks About active on any of its sub-pages", () => {
    renderNavbar("/learn");
    const aboutTrigger = screen.getAllByText("About")[0].closest("button")!.parentElement!;
    expect(aboutTrigger).toHaveClass("text-blue-primary");
  });
});

describe("HeaderNavbar — About dropdown", () => {
  it("navigates directly to /about when the About label is clicked", () => {
    renderNavbar();
    fireEvent.click(screen.getAllByText("About")[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/about");
  });

  it("toggles the dropdown open/closed via the chevron", () => {
    renderNavbar();
    expect(screen.queryByText("Guides & hardware explained")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Toggle About menu"));
    expect(screen.getByText("Guides & hardware explained")).toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", async () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Toggle About menu"));
    expect(screen.getByText("Guides & hardware explained")).toBeInTheDocument();

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    fireEvent.mouseDown(outside);
    await waitFor(() => expect(screen.queryByText("Guides & hardware explained")).not.toBeInTheDocument());
    document.body.removeChild(outside);
  });

  it("closes the dropdown when a sub-item is clicked", async () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText("Toggle About menu"));
    fireEvent.click(screen.getByText("Learn"));
    await waitFor(() => expect(screen.queryByText("Guides & hardware explained")).not.toBeInTheDocument());
  });

  it("highlights the active sub-item", () => {
    renderNavbar("/privacy");
    fireEvent.click(screen.getByLabelText("Toggle About menu"));
    expect(screen.getByText("Privacy Policy").closest("a")).toHaveClass("bg-blue-primary/10");
    expect(screen.getByText("Learn").closest("a")).not.toHaveClass("bg-blue-primary/10");
  });
});
