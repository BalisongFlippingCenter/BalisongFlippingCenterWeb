import axios from "axios";
import { axiosApiInstanceAuth } from "./axios";
import { getCatalogImageUploadUrl } from "./adminCatalogApi";

export interface PresignedUploadTarget {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  isVideo: boolean;
}

const toFileItems = (files: File[]) =>
  files.map((f) => ({ filename: f.name, contentType: f.type }));

// Request presigned S3 PUT URLs for post media, then upload each file directly to S3.
export const uploadPostMediaDirect = async (
  postType: string,
  files: File[]
): Promise<PresignedUploadTarget[]> => {
  if (files.length === 0) return [];

  const { data: targets } = await axiosApiInstanceAuth.post<PresignedUploadTarget[]>(
    "/posts/upload-url",
    { postType, files: toFileItems(files) }
  );

  await Promise.all(
    targets.map((target, i) =>
      axios.put(target.uploadUrl, files[i], {
        headers: { "Content-Type": files[i].type },
      })
    )
  );

  return targets;
};

// Request a presigned S3 PUT URL for a catalog knife's cover photo or a specific
// variant's image, then upload the file directly to S3. Admin-only.
export const uploadCatalogImageDirect = async (
  knifeSlug: string,
  file: File,
  variant?: { versionSlug: string; variantSlug: string }
): Promise<PresignedUploadTarget> => {
  const target = await getCatalogImageUploadUrl({
    knifeSlug,
    versionSlug: variant?.versionSlug,
    variantSlug: variant?.variantSlug,
    filename: file.name,
    contentType: file.type,
  });

  await axios.put(target.uploadUrl, file, { headers: { "Content-Type": file.type } });

  return target;
};

// Request presigned S3 PUT URLs for a new knife's gallery, then upload each file directly to S3.
export const uploadKnifeGalleryMediaDirect = async (
  displayName: string,
  files: File[]
): Promise<PresignedUploadTarget[]> => {
  if (files.length === 0) return [];

  const { data: targets } = await axiosApiInstanceAuth.post<PresignedUploadTarget[]>(
    "/collection/me/knife-gallery-upload-url",
    { displayName, files: toFileItems(files) }
  );

  await Promise.all(
    targets.map((target, i) =>
      axios.put(target.uploadUrl, files[i], {
        headers: { "Content-Type": files[i].type },
      })
    )
  );

  return targets;
};
