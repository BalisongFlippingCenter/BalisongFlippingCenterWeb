import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import FavoriteFlipperInput from "./FavoriteFlipperInput";

describe("FavoriteFlipperInput", () => {
  it("shows the unfavorited state when parentIsFavoriteFlipper is false", () => {
    renderWithProviders(<FavoriteFlipperInput setIsFavoriteFlipperOnChange={vi.fn()} parentIsFavoriteFlipper={false} />);
    expect(screen.getByText("◇")).toBeInTheDocument();
  });

  it("shows the favorited state when parentIsFavoriteFlipper is true", () => {
    renderWithProviders(<FavoriteFlipperInput setIsFavoriteFlipperOnChange={vi.fn()} parentIsFavoriteFlipper={true} />);
    expect(screen.getByText("♦")).toBeInTheDocument();
  });

  it("calls the parent's change handler when toggled", () => {
    const onChange = vi.fn();
    renderWithProviders(<FavoriteFlipperInput setIsFavoriteFlipperOnChange={onChange} parentIsFavoriteFlipper={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Favorite Flipper/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
