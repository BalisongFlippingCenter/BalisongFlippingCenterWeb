import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/renderWithProviders";
import FavoriteKnifeInput from "./FavoriteKnifeInput";

describe("FavoriteKnifeInput", () => {
  it("shows the unfavorited state when parentIsFavoriteKnife is false", () => {
    renderWithProviders(<FavoriteKnifeInput setIsFavoriteKnifeOnChange={vi.fn()} parentIsFavoriteKnife={false} />);
    expect(screen.getByText("☆")).toBeInTheDocument();
  });

  it("shows the favorited state when parentIsFavoriteKnife is true", () => {
    renderWithProviders(<FavoriteKnifeInput setIsFavoriteKnifeOnChange={vi.fn()} parentIsFavoriteKnife={true} />);
    expect(screen.getByText("★")).toBeInTheDocument();
  });

  it("calls the parent's change handler when toggled", () => {
    const onChange = vi.fn();
    renderWithProviders(<FavoriteKnifeInput setIsFavoriteKnifeOnChange={onChange} parentIsFavoriteKnife={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Favorite Knife/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
