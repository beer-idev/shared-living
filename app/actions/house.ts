"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function createHouseAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/onboarding?error=Supabase+is+not+configured");
  const name = z.string().min(2).max(80).parse(formData.get("name"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_house", { house_name: name });
  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function joinHouseAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/onboarding?error=Supabase+is+not+configured");
  const code = z.string().min(4).max(20).parse(formData.get("inviteCode"));
  const displayName = String(formData.get("displayName") || "").trim();
  if (displayName && (displayName.length < 2 || displayName.length > 60)) redirect("/onboarding?error=Display+name+must+be+between+2+and+60+characters");
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_house_by_code", { code });
  const returnTo = String(formData.get("returnTo") || "/onboarding");
  if (error) redirect(`${returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/onboarding"}?error=${encodeURIComponent(error.message)}`);
  if (displayName) {
    const { data: userData } = await supabase.auth.getUser();
    const { error: profileError } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", userData.user?.id ?? "");
    if (profileError) redirect(`${returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/onboarding"}?error=${encodeURIComponent(profileError.message)}`);
  }
  redirect("/dashboard");
}

export async function createCelebrationAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/harmony?error=Connect+Supabase+to+create+a+celebration");
  const schema = z.object({ title: z.string().min(2).max(100), details: z.string().max(500).optional(), location: z.string().max(100).optional(), startsAt: z.string().min(1) });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/harmony?error=Please+check+the+celebration+details");
  const context = await getAppContext();
  const supabase = await createClient();
  const { error } = await supabase.from("celebrations").insert({ house_id: context.house.id, title: parsed.data.title, details: parsed.data.details || null, location: parsed.data.location || null, starts_at: new Date(parsed.data.startsAt).toISOString(), created_by: context.userId });
  if (error) redirect(`/harmony?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/harmony");
  revalidatePath("/notifications");
  redirect("/harmony?celebration=1");
}

export async function updateProfileAction(formData: FormData) {
  const returnTo = formData.get("returnTo") === "/profile" ? "/profile" : "/settings";
  if (!isSupabaseConfigured) redirect(`${returnTo}?error=Connect+Supabase+to+save+changes`);
  const displayName = z.string().min(2).max(60).parse(formData.get("displayName"));
  const context = await getAppContext();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", context.userId);
  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect(`${returnTo}?saved=1`);
}

export async function updateHouseAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/settings?error=Connect+Supabase+to+save+changes");
  const schema = z.object({ houseName: z.string().min(2).max(80), currency: z.string().length(3) });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/settings?error=Please+check+the+house+settings");
  const context = await getAppContext();
  const supabase = await createClient();
  const { error } = await supabase.from("houses").update({ name: parsed.data.houseName, currency: parsed.data.currency.toUpperCase() }).eq("id", context.house.id);
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/settings?error=Connect+Supabase+to+save+changes");
  const context = await getAppContext();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    task_reminders: formData.get("taskReminders") === "on",
    bill_alerts: formData.get("billAlerts") === "on",
    house_activity: formData.get("houseActivity") === "on",
  }).eq("id", context.userId);
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function removeMemberAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/members?error=Connect+Supabase+to+manage+members");
  const memberId = z.string().uuid().parse(formData.get("memberId"));
  const context = await getAppContext();
  const currentMember = context.members.find((member) => member.user_id === context.userId);
  if (currentMember?.role !== "owner") redirect("/members?error=Only+the+house+owner+can+remove+members");
  if (memberId === context.userId) redirect("/members?error=The+house+owner+cannot+remove+themselves");
  if (!context.members.some((member) => member.user_id === memberId)) redirect("/members?error=That+person+is+not+in+this+house");
  const supabase = await createClient();
  const { error } = await supabase.from("house_members").delete().eq("house_id", context.house.id).eq("user_id", memberId);
  if (error) redirect(`/members?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/members");
  redirect("/members?removed=1");
}
