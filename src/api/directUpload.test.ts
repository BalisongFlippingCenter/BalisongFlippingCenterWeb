import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "./axios";
import { uploadPostMediaDirect, uploadCatalogImageDirect, uploadKnifeGalleryMediaDirect } from "./directUpload";
import { makeTestStore } from "../test/testStore";

const authMock = new MockAdapter(axiosApiInstanceAuth);

function makeFile(name: string, type: string): File {
  return new File(["content"], name, { type });
}

beforeEach(() => {
  authMock.reset();
  setStore(makeTestStore() as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("uploadPostMediaDirect", () => {
  it("returns an empty array without calling the API when there are no files", async () => {
    const result = await uploadPostMediaDirect("GENERIC", []);
    expect(result).toEqual([]);
  });

  it("requests presigned targets, uploads each file to S3, and returns the targets", async () => {
    const files = [makeFile("a.jpg", "image/jpeg"), makeFile("b.png", "image/png")];
    const targets = [
      { key: "k1", uploadUrl: "https://s3/put-a", publicUrl: "https://cdn/a", isVideo: false },
      { key: "k2", uploadUrl: "https://s3/put-b", publicUrl: "https://cdn/b", isVideo: false },
    ];

    authMock.onPost("/posts/upload-url").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toEqual({
        postType: "GENERIC",
        files: [
          { filename: "a.jpg", contentType: "image/jpeg" },
          { filename: "b.png", contentType: "image/png" },
        ],
      });
      return [200, targets];
    });

    const putSpy = vi.spyOn(axios, "put").mockResolvedValue({ status: 200 });

    const result = await uploadPostMediaDirect("GENERIC", files);

    expect(result).toEqual(targets);
    expect(putSpy).toHaveBeenCalledTimes(2);
    expect(putSpy).toHaveBeenNthCalledWith(1, "https://s3/put-a", files[0], {
      headers: { "Content-Type": "image/jpeg" },
    });
    expect(putSpy).toHaveBeenNthCalledWith(2, "https://s3/put-b", files[1], {
      headers: { "Content-Type": "image/png" },
    });
  });
});

describe("uploadKnifeGalleryMediaDirect", () => {
  it("returns an empty array without calling the API when there are no files", async () => {
    const result = await uploadKnifeGalleryMediaDirect("My Knife", []);
    expect(result).toEqual([]);
  });

  it("requests presigned targets keyed by displayName and uploads each file", async () => {
    const files = [makeFile("gallery.jpg", "image/jpeg")];
    const targets = [{ key: "k1", uploadUrl: "https://s3/put-gallery", publicUrl: "https://cdn/g", isVideo: false }];

    authMock.onPost("/collection/me/knife-gallery-upload-url").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body.displayName).toBe("My Knife");
      return [200, targets];
    });
    const putSpy = vi.spyOn(axios, "put").mockResolvedValue({ status: 200 });

    const result = await uploadKnifeGalleryMediaDirect("My Knife", files);
    expect(result).toEqual(targets);
    expect(putSpy).toHaveBeenCalledWith("https://s3/put-gallery", files[0], {
      headers: { "Content-Type": "image/jpeg" },
    });
  });
});

describe("uploadCatalogImageDirect", () => {
  it("requests a presigned URL for the cover photo (no variant) and uploads the file", async () => {
    const file = makeFile("cover.jpg", "image/jpeg");
    const target = { key: "k1", uploadUrl: "https://s3/put-cover", publicUrl: "https://cdn/cover", isVideo: false };

    authMock.onPost("/admin/catalog/upload-url").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toEqual({
        knifeSlug: "krake-raken",
        versionSlug: undefined,
        variantSlug: undefined,
        filename: "cover.jpg",
        contentType: "image/jpeg",
      });
      return [200, target];
    });
    const putSpy = vi.spyOn(axios, "put").mockResolvedValue({ status: 200 });

    const result = await uploadCatalogImageDirect("krake-raken", file);
    expect(result).toEqual(target);
    expect(putSpy).toHaveBeenCalledWith("https://s3/put-cover", file, {
      headers: { "Content-Type": "image/jpeg" },
    });
  });

  it("includes versionSlug/variantSlug in the request when uploading a variant image", async () => {
    const file = makeFile("variant.jpg", "image/jpeg");
    authMock.onPost("/admin/catalog/upload-url").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body.versionSlug).toBe("v3");
      expect(body.variantSlug).toBe("tanto");
      return [200, { key: "k2", uploadUrl: "https://s3/put-v", publicUrl: "https://cdn/v", isVideo: false }];
    });
    vi.spyOn(axios, "put").mockResolvedValue({ status: 200 });

    await uploadCatalogImageDirect("krake-raken", file, { versionSlug: "v3", variantSlug: "tanto" });
  });
});
