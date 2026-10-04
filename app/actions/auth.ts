"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, firebaseAuth, isFirebaseConfigured, sessionCookieName } from "@/lib/firebase/server";
import { joinHouseAsUser } from "@/lib/firebase/house";

const credentials = z.object({ email: z.email(), password: z.string().min(8) });
const maxAge = 60 * 60 * 24 * 5;

async function firebasePasswordRequest(operation: "signInWithPassword" | "signUp", email: string, password: string) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${operation}?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }), cache: "no-store",
  });
  const data = await response.json() as { idToken?: string; localId?: string; error?: { message?: string } };
  if (!response.ok || !data.idToken || !data.localId) throw new Error(data.error?.message ?? "Could not authenticate");
  return data;
}

async function setSession(idToken: string) {
  const session = await firebaseAuth().createSessionCookie(idToken, { expiresIn: maxAge * 1000 });
  (await cookies()).set(sessionCookieName, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
}

function safeNext(value: unknown, fallback: string) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

async function joinFromNext(next: string, userId: string, email: string, displayName = "") {
  const match = /^\/join\/([A-Za-z0-9]{4,32})$/.exec(next);
  if (!match) return false;
  try { await joinHouseAsUser(userId, email, match[1], displayName); }
  catch (error) { redirect(`/onboarding?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not join house")}`); }
  return true;
}

export async function signInAction(formData: FormData) {
  if (!isFirebaseConfigured) redirect("/setup");
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=Enter+a+valid+email+and+password");
  let result: { idToken?: string; localId?: string };
  try { result = await firebasePasswordRequest("signInWithPassword", parsed.data.email, parsed.data.password); }
  catch { redirect("/login?error=Incorrect+email+or+password"); }
  await setSession(result.idToken!);
  const next = safeNext(formData.get("next"), "/dashboard");
  if (await joinFromNext(next, result.localId!, parsed.data.email)) redirect("/dashboard");
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  if (!isFirebaseConfigured) redirect("/setup");
  const parsed = credentials.extend({ displayName: z.string().min(2).max(60) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/register?error=Please+check+your+details");
  let result: { idToken?: string; localId?: string };
  try { result = await firebasePasswordRequest("signUp", parsed.data.email, parsed.data.password); }
  catch (error) { redirect(`/register?error=${encodeURIComponent(error instanceof Error && error.message === "EMAIL_EXISTS" ? "This email already has an account" : "Account could not be created")}`); }
  await db().collection("profiles").doc(result.localId!).set({
    display_name: parsed.data.displayName, avatar_path: null,
    task_reminders: true, bill_alerts: true, house_activity: true,
  });
  await setSession(result.idToken!);
  const next = safeNext(formData.get("next"), "/onboarding");
  if (await joinFromNext(next, result.localId!, parsed.data.email, parsed.data.displayName)) redirect("/dashboard");
  redirect(next);
}

export async function sendPasswordResetAction(formData: FormData) {
  if (!isFirebaseConfigured) redirect("/setup");
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) redirect("/forgot-password?error=Enter+a+valid+email+address");
  try {
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email: parsed.data }), cache: "no-store",
    });
  } catch { /* Keep the response generic so account existence is not disclosed. */ }
  redirect("/forgot-password?sent=1");
}

export async function signOutAction() {
  (await cookies()).delete(sessionCookieName);
  redirect("/login");
}
