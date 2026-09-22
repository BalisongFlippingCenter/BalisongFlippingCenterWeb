import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TermsOfServicePage from "./TermsOfServicePage";

describe("TermsOfServicePage", () => {
  it("renders the Terms of Service heading and draft notice", () => {
    render(<TermsOfServicePage />);
    expect(screen.getByRole("heading", { name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.getByText(/Draft notice:/)).toBeInTheDocument();
  });
});
