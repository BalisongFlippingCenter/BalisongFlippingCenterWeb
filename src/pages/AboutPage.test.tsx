import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import AboutPage from "./AboutPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockNavigate.mockReset();
  Object.defineProperty(window, "location", {
    value: { ...window.location, href: "" },
    writable: true,
  });
});

describe("AboutPage", () => {
  it("disables Send Message until a message is entered", () => {
    renderWithProviders(<AboutPage />);
    const send = screen.getByRole("button", { name: /Send Message/ });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Write your message here..."), { target: { value: "Hello there" } });
    expect(send).not.toBeDisabled();
  });

  it("shows a shrinking character counter once typing starts", () => {
    renderWithProviders(<AboutPage />);
    const textarea = screen.getByPlaceholderText("Write your message here...");
    expect(screen.queryByText("1000")).not.toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Hi" } });
    expect(screen.getByText("998")).toBeInTheDocument();
  });

  it("does not allow typing past the 1000 character limit", () => {
    renderWithProviders(<AboutPage />);
    const textarea = screen.getByPlaceholderText("Write your message here...") as HTMLTextAreaElement;
    const tooLong = "a".repeat(1001);
    fireEvent.change(textarea, { target: { value: tooLong } });
    expect(textarea.value).toBe("");
  });

  it("builds a mailto link from the subject and message on send", () => {
    renderWithProviders(<AboutPage />);
    fireEvent.change(screen.getByPlaceholderText("What's this about?"), { target: { value: "Bug report" } });
    fireEvent.change(screen.getByPlaceholderText("Write your message here..."), { target: { value: "Something's broken" } });
    fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

    expect(window.location.href).toBe(
      "mailto:support.balisongflippingcenter@gmail.com?subject=Bug%20report&body=Something's%20broken",
    );
  });

  it("navigates to /learn when the learn CTA is clicked", () => {
    renderWithProviders(<AboutPage />);
    fireEvent.click(screen.getByRole("button", { name: /New to balisongs\?/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/learn");
  });
});
