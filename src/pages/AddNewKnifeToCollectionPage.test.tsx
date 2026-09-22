import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import { CollectionKnifeDTO } from "../modals/CollectionKnife";

vi.mock("../components/newCollectionKnifeComponents/NewCollectionKnifeForm", () => ({
  default: ({ setNewKnifeObjOnSubmit }: any) => (
    <div data-testid="step-form">
      <button onClick={() => setNewKnifeObjOnSubmit({ displayName: "My Knife" } as CollectionKnifeDTO)}>
        Complete Form
      </button>
    </div>
  ),
}));
vi.mock("../components/newCollectionKnifeComponents/GalleryInput", () => ({
  default: ({ setStepManually }: any) => (
    <div data-testid="step-gallery">
      <button onClick={() => setStepManually("3")}>Advance Step</button>
    </div>
  ),
}));
vi.mock("../components/newCollectionKnifeComponents/NewCollectionKnifeSummary", () => ({
  default: () => <div data-testid="step-summary" />,
}));
vi.mock("../components/newCollectionKnifeComponents/NewCollectionKnifeSubmit", () => ({
  default: () => <div data-testid="step-submit" />,
}));

import AddNewKnifeToCollectionPage from "./AddNewKnifeToCollectionPage";

describe("AddNewKnifeToCollectionPage", () => {
  it("starts on step 1 (the form) with steps 2-4 locked", () => {
    renderWithProviders(<AddNewKnifeToCollectionPage />);
    expect(screen.getByTestId("step-form")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gallery/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Summary/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Submit/ })).toBeDisabled();
  });

  it("advances to the gallery step and unlocks the remaining steps once the form is submitted", () => {
    renderWithProviders(<AddNewKnifeToCollectionPage />);
    fireEvent.click(screen.getByRole("button", { name: "Complete Form" }));

    expect(screen.getByTestId("step-gallery")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Summary/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /Submit/ })).not.toBeDisabled();
  });

  it("allows jumping directly to an unlocked step via the step indicator", () => {
    renderWithProviders(<AddNewKnifeToCollectionPage />);
    fireEvent.click(screen.getByRole("button", { name: "Complete Form" }));
    fireEvent.click(screen.getByRole("button", { name: /Submit/ }));
    expect(screen.getByTestId("step-submit")).toBeInTheDocument();
  });

  it("allows a child step to move the page forward via setStepManually", () => {
    renderWithProviders(<AddNewKnifeToCollectionPage />);
    fireEvent.click(screen.getByRole("button", { name: "Complete Form" }));
    fireEvent.click(screen.getByRole("button", { name: "Advance Step" }));
    expect(screen.getByTestId("step-summary")).toBeInTheDocument();
  });
});
