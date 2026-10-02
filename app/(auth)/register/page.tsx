import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signUpAction } from "@/app/actions/auth";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <div className="auth-form"><p className="eyebrow">Your house starts with you</p><h2>Create your account</h2><p>Set up your profile, then create or join a house.</p><StatusMessage error={error} /><form action={signUpAction} className="form-stack"><label>Your name<input name="displayName" placeholder="Napat W." autoComplete="name" required /></label><label>Email<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label><label>Password<input name="password" type="password" minLength={8} autoComplete="new-password" required /><small>Use at least 8 characters.</small></label><SubmitButton className="button button--primary button--wide" pendingLabel="Creating account…">Create account <ArrowRight size={17} /></SubmitButton></form><p className="auth-alt">Already have an account? <Link href="/login">Log in</Link></p></div>;
}
