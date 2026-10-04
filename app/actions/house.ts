"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppContext } from "@/lib/data";
import { joinHouseAsUser } from "@/lib/firebase/house";
import { currentUser, db } from "@/lib/firebase/server";
import { notifyUsers } from "@/lib/firebase/store";

function inviteCode(name: string) {
  const prefix = name.normalize("NFKD").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase() || "HOUSE";
  return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function createHouseAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fonboarding");
  const name = z.string().trim().min(2).max(80).safeParse(formData.get("name"));
  if (!name.success) redirect("/onboarding?error=Enter+a+house+name");

  const database = db();
  const existing = await database.collection("house_members").doc(user.uid).get();
  if (existing.exists) redirect("/dashboard");

  const ref = database.collection("houses").doc();
  const code = inviteCode(name.data);
  const now = new Date().toISOString();
  const batch = database.batch();
  batch.set(ref, {
    name: name.data,
    invite_code: code,
    currency: "THB",
    harmony_score: 0,
    created_by: user.uid,
    created_at: now,
    updated_at: now,
  });
  batch.set(database.collection("invite_codes").doc(code), { house_id: ref.id });
  batch.set(database.collection("house_members").doc(user.uid), {
    house_id: ref.id,
    role: "owner",
    points: 0,
    joined_at: now,
  });
  await batch.commit();
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function joinHouseAction(formData: FormData) {
  const code = String(formData.get("inviteCode") ?? "").trim().toUpperCase();
  const user = await currentUser();
  if (!user) redirect(`/register?next=${encodeURIComponent(`/join/${code}`)}`);
  try {
    await joinHouseAsUser(user.uid, user.email ?? "", code, String(formData.get("displayName") ?? "").trim());
  } catch (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not join house")}`);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function createCelebrationAction(formData: FormData) {
  const parsed = z.object({
    title: z.string().trim().min(2).max(100),
    details: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    startsAt: z.string().min(1),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(parsed.data.startsAt) || Number.isNaN(Date.parse(`${parsed.data.startsAt}:00+07:00`))) {
    redirect("/harmony?error=Please+check+the+celebration+details");
  }

  const context = await getAppContext();
  if (context.members.find((member) => member.user_id === context.userId)?.role !== "owner") {
    redirect("/harmony?error=Only+the+owner+can+create+celebrations");
  }

  const startsAt = new Date(`${parsed.data.startsAt}:00+07:00`).toISOString();
  const ref = db().collection("celebrations").doc();
  await ref.set({
    house_id: context.house.id,
    title: parsed.data.title,
    details: parsed.data.details || null,
    location: parsed.data.location || null,
    starts_at: startsAt,
    created_by: context.userId,
    created_at: new Date().toISOString(),
  });

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
  await notifyUsers(context.members.map((member) => member.user_id), {
    type: "celebration",
    title: `Celebrate together: ${parsed.data.title}`,
    body: `${dateLabel}${parsed.data.location ? ` · ${parsed.data.location}` : ""}`,
    href: "/harmony",
  });

  revalidatePath("/harmony");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect("/harmony?celebration=1");
}

export async function updateProfileAction(formData: FormData) {
  const name = z.string().trim().min(2).max(60).safeParse(formData.get("displayName"));
  if (!name.success) redirect("/profile?error=Enter+a+valid+name");
  const context = await getAppContext();
  await db().collection("profiles").doc(context.userId).set({ display_name: name.data, updated_at: new Date().toISOString() }, { merge: true });
  revalidatePath("/profile");
  revalidatePath("/members");
  revalidatePath("/", "layout");
  redirect(formData.get("returnTo") === "/settings" ? "/settings?saved=1" : "/profile?saved=1");
}

export async function updateHouseAction(formData: FormData) {
  const parsed = z.object({ houseName: z.string().trim().min(2).max(80), currency: z.string().length(3) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/settings?error=Please+check+the+house+settings");

  const context = await getAppContext();
  if (context.members.find((member) => member.user_id === context.userId)?.role !== "owner") {
    redirect("/settings?error=Only+the+owner+can+change+house+settings");
  }

  const database = db();
  const code = parsed.data.houseName === context.house.name ? context.house.invite_code : inviteCode(parsed.data.houseName);
  const batch = database.batch();
  batch.update(database.collection("houses").doc(context.house.id), {
    name: parsed.data.houseName,
    currency: parsed.data.currency.toUpperCase(),
    invite_code: code,
    updated_at: new Date().toISOString(),
  });
  if (code !== context.house.invite_code) {
    batch.set(database.collection("invite_codes").doc(code), { house_id: context.house.id });
    batch.delete(database.collection("invite_codes").doc(context.house.invite_code));
  }
  await batch.commit();

  revalidatePath("/settings");
  revalidatePath("/members");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const context = await getAppContext();
  await db().collection("profiles").doc(context.userId).set({
    task_reminders: formData.get("taskReminders") === "on",
    bill_alerts: formData.get("billAlerts") === "on",
    house_activity: formData.get("houseActivity") === "on",
    updated_at: new Date().toISOString(),
  }, { merge: true });
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function removeMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) redirect("/members?error=Invalid+member");

  const context = await getAppContext();
  const database = db();
  try {
    await database.runTransaction(async (transaction) => {
      const ownerRef = database.collection("house_members").doc(context.userId);
      const targetRef = database.collection("house_members").doc(memberId);
      const [owner, target] = await Promise.all([transaction.get(ownerRef), transaction.get(targetRef)]);
      if (!owner.exists || owner.get("house_id") !== context.house.id || owner.get("role") !== "owner") throw new Error("Only the owner can remove members");
      if (memberId === context.userId) throw new Error("The owner cannot remove themselves");
      if (!target.exists || target.get("house_id") !== context.house.id) throw new Error("This member is no longer in the house");
      transaction.delete(targetRef);
    });
  } catch (error) {
    redirect(`/members?error=${encodeURIComponent(error instanceof Error ? error.message : "Member could not be removed")}`);
  }

  revalidatePath("/members");
  revalidatePath("/dashboard");
  revalidatePath("/chores");
  revalidatePath("/expenses");
  revalidatePath("/harmony");
  revalidatePath("/", "layout");
  redirect("/members?removed=1");
}
