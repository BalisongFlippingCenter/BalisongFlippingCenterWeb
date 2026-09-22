import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { makeTestStore } from "../test/testStore";
import ProfileImgDisplay from "./ProfileImgDisplay";

const authMock = new MockAdapter(axiosApiInstanceAuth);

beforeEach(() => {
  authMock.reset();
  setStore(makeTestStore() as any);
});

describe("ProfileImgDisplay", () => {
  it("renders a plain white placeholder when imgStr is null", () => {
    const { container } = render(<ProfileImgDisplay imgStr={null} />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-white");
  });

  it("fetches and renders a png image as base64", async () => {
    authMock.onGet("/file/img-1").reply(200, "raw-bytes", { "content-type": "image/png" });
    render(<ProfileImgDisplay imgStr="img-1" />);
    const img = await screen.findByRole("img");
    expect((img as HTMLImageElement).src).toMatch(/^data:image\/png;base64,/);
  });

  it("fetches and renders a jpeg image as base64", async () => {
    authMock.onGet("/file/img-2").reply(200, "raw-bytes", { "content-type": "image/jpeg" });
    render(<ProfileImgDisplay imgStr="img-2" />);
    const img = await screen.findByRole("img");
    expect((img as HTMLImageElement).src).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("falls back to the placeholder when the fetch fails", async () => {
    authMock.onGet("/file/broken").reply(500);
    const { container } = render(<ProfileImgDisplay imgStr="broken" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});
