"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/data";
import { db } from "@/lib/firebase/server";

function safeNotificationDestination(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function refreshNotificationViews() {
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function markNotificationReadAction(notificationId: string) {
  const context = await getAppContext();
  const notification = await db().collection("notifications").doc(notificationId).get();
  if (!notification.exists || notification.get("user_id") !== context.userId) {
    redirect("/notifications?error=Notification+could+not+be+opened");
  }
  if (!notification.get("read_at")) {
    await notification.ref.update({ read_at: new Date().toISOString() });
  }
  refreshNotificationViews();
  redirect(safeNotificationDestination(notification.get("href")));
}

export async function markAllNotificationsReadAction() {
  const context = await getAppContext();
  const rows = await db().collection("notifications").where("user_id", "==", context.userId).get();
  const unread = rows.docs.filter((row) => !row.get("read_at"));
  const readAt = new Date().toISOString();
  for (let index = 0; index < unread.length; index += 400) {
    const batch = db().batch();
    for (const row of unread.slice(index, index + 400)) batch.update(row.ref, { read_at: readAt });
    await batch.commit();
  }
  refreshNotificationViews();
  redirect("/notifications?read=all");
}
