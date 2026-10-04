import "server-only";
import { head } from "@vercel/blob";

export async function verifiedImageUrl(url: string, prefix: string) {
  if (!url) throw new Error("Photo upload is required");
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); }
  catch { throw new Error("Invalid photo"); }
  if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".public.blob.vercel-storage.com") || !parsedUrl.pathname.startsWith(`/${prefix}`)) throw new Error("Invalid photo");
  const blob = await head(url);
  if (blob.url !== url || !blob.pathname.startsWith(prefix) || blob.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(blob.contentType)) throw new Error("Invalid photo");
  return blob.url;
}
