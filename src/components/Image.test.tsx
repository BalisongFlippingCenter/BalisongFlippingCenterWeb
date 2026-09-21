import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstance } from "../api/axios";
import Image from "./Image";

const plainMock = new MockAdapter(axiosApiInstance);

beforeEach(() => {
  plainMock.reset();
});

describe("Image", () => {
  it("shows a No Image placeholder when imageId is empty/null/undefined", () => {
    const { rerender } = render(<Image imageId={null} />);
    expect(screen.getByText("No Image")).toBeInTheDocument();
    rerender(<Image imageId="" />);
    expect(screen.getByText("No Image")).toBeInTheDocument();
    rerender(<Image imageId={undefined} />);
    expect(screen.getByText("No Image")).toBeInTheDocument();
  });

  it("renders a direct S3 URL as an <img> without hitting the API", () => {
    render(<Image imageId="https://cdn.example.com/pic.jpg" />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toBe("https://cdn.example.com/pic.jpg");
    expect(plainMock.history.get.length).toBe(0);
  });

  it("fetches a legacy file id from /file/:id and renders it as a base64 image", async () => {
    plainMock.onGet("/file/legacy-id-123").reply(200, "raw-bytes", { "content-type": "image/png" });
    render(<Image imageId="legacy-id-123" />);

    expect(screen.getByText("loading...")).toBeInTheDocument();

    const img = await screen.findByRole("img");
    expect((img as HTMLImageElement).src).toMatch(/^data:image\/\*;base64,/);
  });

  it("renders a video element when the fetched content type is video/mp4", async () => {
    plainMock.onGet("/file/video-id").reply(200, "raw-bytes", { "content-type": "video/mp4" });
    const { container } = render(<Image imageId="video-id" />);

    await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.src).toMatch(/^data:video\/mp4;base64,/);
  });

  it("shows an error state when the fetch fails", async () => {
    plainMock.onGet("/file/broken-id").reply(500);
    render(<Image imageId="broken-id" />);
    await screen.findByText("ERROR");
  });
});
