import axios from "axios";
import { axiosApiInstanceAuth } from "./axios";

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
