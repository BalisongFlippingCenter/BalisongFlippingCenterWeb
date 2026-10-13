import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PrivacyPolicyPage from "./PrivacyPolicyPage";

describe("PrivacyPolicyPage", () => {
  it("renders the Privacy Policy heading and draft notice", () => {
    render(<MemoryRouter><PrivacyPolicyPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByText(/Draft notice:/)).toBeInTheDocument();
  });
});
