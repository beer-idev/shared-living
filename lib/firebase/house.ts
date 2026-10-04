import "server-only";
import { db } from "./server";
import { houseByCode, notifyUsers } from "./store";

export async function joinHouseAsUser(userId: string, email: string, code: string, displayName = "") {
  const normalized = code.trim().toUpperCase();
  const house = await houseByCode(normalized);
  if (!house) throw new Error("Invite link is invalid");
  const database = db();
  const memberRef = database.collection("house_members").doc(userId);
  const existing = await memberRef.get();
  if (existing.exists && existing.get("house_id") !== house.id) throw new Error("You already belong to a house");
  if (!existing.exists) await memberRef.set({ house_id: house.id, role: "member", points: 0, joined_at: new Date().toISOString() });
  if (displayName.length >= 2 && displayName.length <= 60) await database.collection("profiles").doc(userId).update({ display_name: displayName });
  if (!existing.exists) {
    const members = await database.collection("house_members").where("house_id", "==", house.id).get();
    await notifyUsers(members.docs.filter((row) => row.id !== userId).map((row) => row.id), { type: "member", title: "A housemate joined the house", body: displayName || email || "New member", href: "/members" });
  }
}
