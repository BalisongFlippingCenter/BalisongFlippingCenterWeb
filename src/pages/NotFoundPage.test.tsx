import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import NotFoundPage from "./NotFoundPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("NotFoundPage", () => {
  it("renders the 404 message", () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("navigates to /community when Go to Community is clicked", () => {
    renderWithProviders(<NotFoundPage />);
    fireEvent.click(screen.getByRole("button", { name: "Go to Community" }));
    expect(mockNavigate).toHaveBeenCalledWith("/community");
  });

  it("navigates back when Go Back is clicked", () => {
    renderWithProviders(<NotFoundPage />);
    fireEvent.click(screen.getByRole("button", { name: "Go Back" }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("navigates home when the logo is clicked", () => {
    const { container } = renderWithProviders(<NotFoundPage />);
    fireEvent.click(container.querySelector(".cursor-pointer") as HTMLElement);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
