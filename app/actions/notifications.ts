"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function markAllNotificationsReadAction() {
  if (!isSupabaseConfigured) redirect("/notifications?error=Connect+Supabase+to+update+notifications");
  const context = await getAppContext();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", context.userId).is("read_at", null);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
