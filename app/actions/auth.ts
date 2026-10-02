"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/login?error=Supabase+is+not+configured");
  const parsed = credentialsSchema.extend({ next: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=Enter+a+valid+email+and+password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  const next = parsed.data.next?.startsWith("/") && !parsed.data.next.startsWith("//") ? parsed.data.next : "/dashboard";
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/register?error=Supabase+is+not+configured");
  const schema = credentialsSchema.extend({ displayName: z.string().min(2).max(60) });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/register?error=Please+check+your+details");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
  redirect("/onboarding");
}

export async function signOutAction() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
