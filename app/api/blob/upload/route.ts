import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { currentUser, db } from "@/lib/firebase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadPresignedBody;
    const result = await handleUploadPresigned({
      body, request,
      getSignedToken: async (pathname) => {
        const user = await currentUser();
        if (!user) throw new Error("Sign in to upload");
        const parts = pathname.split("/");
        const [kind, itemId, userId] = parts;
        if (userId !== user.uid || !itemId || parts.length !== 4) throw new Error("Invalid upload path");
        const membership = await db().collection("house_members").doc(user.uid).get();
        const houseId = membership.get("house_id");
        if (!houseId) throw new Error("Not a house member");
        if (kind === "task-proofs") {
          const task = await db().collection("tasks").doc(itemId).get();
          if (!task.exists || task.get("house_id") !== houseId || task.get("status") !== "pending" || (task.get("assigned_to") !== user.uid && membership.get("role") !== "owner")) throw new Error("You cannot upload proof for this task");
        } else if (kind !== "expense-receipts" || itemId !== "new") throw new Error("Invalid upload type");

        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            storeId: process.env.DEV_BLOB_STORE_ID ?? process.env.BLOB_STORE_ID,
            allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
            maximumSizeInBytes: 5 * 1024 * 1024,
            validUntil: Date.now() + 5 * 60 * 1000,
          }),
        };
      },
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
