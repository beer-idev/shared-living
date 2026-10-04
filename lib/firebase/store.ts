import "server-only";

import { db } from "./server";
import type { House, Member, Notification, Profile } from "../types";

export function documentData<T>(snapshot: FirebaseFirestore.DocumentSnapshot): T | null {
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } as T : null;
}

export async function houseMembers(houseId: string): Promise<Member[]> {
  const rows = await db().collection("house_members").where("house_id", "==", houseId).get();
  return Promise.all(rows.docs.map(async (row) => {
    const profile = documentData<Profile>(await db().collection("profiles").doc(row.id).get()) ?? {
      id: row.id,
      display_name: "Housemate",
      avatar_path: null,
      task_reminders: true,
      bill_alerts: true,
      house_activity: true,
    };
    return {
      user_id: row.id,
      role: row.get("role") as Member["role"],
      profile,
      points: Number(row.get("points") ?? 0),
      joined_at: row.get("joined_at") as string | undefined,
    } as Member;
  }));
}

export function notificationData(userId: string, notification: Omit<Notification, "id" | "read_at" | "created_at">) {
  return { ...notification, user_id: userId, read_at: null, created_at: new Date().toISOString() };
}

export async function notifyUsers(userIds: string[], notification: Omit<Notification, "id" | "read_at" | "created_at">) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return;
  const database = db();
  const batch = database.batch();
  for (const uid of uniqueIds) {
    batch.set(database.collection("notifications").doc(), notificationData(uid, notification));
  }
  await batch.commit();
}

export async function houseByCode(code: string): Promise<House | null> {
  const match = await db().collection("invite_codes").doc(code.toUpperCase()).get();
  if (!match.exists) return null;
  return documentData<House>(await db().collection("houses").doc(match.get("house_id")).get());
}
