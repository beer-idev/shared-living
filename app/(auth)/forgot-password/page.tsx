import type { Metadata } from "next";
import Link from "next/link";
import { sendPasswordResetAction } from "@/app/actions/auth";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const query = await searchParams;
  return <div className="auth-form">
    <p className="eyebrow">Welcome back</p>
    <h2>Reset password</h2>
    <p>Enter your email and we&apos;ll send a Firebase password reset link.</p>
    {query.sent ? <StatusMessage success="If an account exists for that email, a reset link is on its way." /> : <StatusMessage error={query.error} />}
    <form action={sendPasswordResetAction} className="form-stack">
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <SubmitButton className="button button--primary button--wide" pendingLabel="Sending link…">Send reset link</SubmitButton>
    </form>
    <p className="auth-alt"><Link href="/login">Back to log in</Link></p>
  </div>;
}
