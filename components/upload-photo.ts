"use client";
import { uploadPresigned } from "@vercel/blob/client";

export async function uploadPhoto(file: File, pathPrefix: string) {
  if (!file.size || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP photo under 5 MB");
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  try {
    const blob = await uploadPresigned(`${pathPrefix}/${crypto.randomUUID()}.${extension}`, file, { access: "public", handleUploadUrl: "/api/blob/upload" });
    return blob.url;
  } catch (error) {
    if (error instanceof Error && /retrieve the presigned URL|credentials|token/i.test(error.message)) {
      throw new Error("Photo storage is temporarily unavailable. Please try again.");
    }
    throw error;
  }
}
