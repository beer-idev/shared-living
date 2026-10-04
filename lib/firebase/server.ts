import "server-only";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { cookies } from "next/headers";

export const isFirebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID);
export const sessionCookieName = "shared_living_session";

function app() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not configured");
  const credential = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
      ? cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") })
      : applicationDefault();
  return initializeApp({ credential, projectId });
}

export function db() { return getFirestore(app()); }
export function firebaseAuth() { return getAuth(app()); }

export async function currentUser() {
  const session = (await cookies()).get(sessionCookieName)?.value;
  if (!session || !isFirebaseConfigured) return null;
  try { return await firebaseAuth().verifySessionCookie(session, true); }
  catch { return null; }
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Authentication required");
  return user;
}
