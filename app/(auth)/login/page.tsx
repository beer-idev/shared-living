import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signInAction } from "@/app/actions/auth";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { isFirebaseConfigured } from "@/lib/firebase/server";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return <div className="auth-form"><p className="eyebrow">Welcome home</p><h2>Log in</h2><p>See what’s happening around your house.</p><StatusMessage error={error} />{!isFirebaseConfigured && <StatusMessage error="Firebase is not configured yet. Open setup to connect the app." />}<form action={signInAction} className="form-stack">{next && <input type="hidden" name="next" value={next} />}<label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label><SubmitButton className="button button--primary button--wide" pendingLabel="Logging in…">Log in <ArrowRight size={17} /></SubmitButton></form><p className="auth-alt"><Link href="/forgot-password">Forgot password?</Link></p><p className="auth-alt">New to Shared Living? <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}>Create an account</Link></p></div>;
}
