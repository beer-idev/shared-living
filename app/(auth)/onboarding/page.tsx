import type { Metadata } from "next";
import { Home, Link2 } from "lucide-react";
import { createHouseAction, joinHouseAction } from "@/app/actions/house";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Find your house" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <div className="auth-form auth-form--wide"><p className="eyebrow">One more step</p><h2>Find your place</h2><p>Start a new house or join the people you live with.</p><StatusMessage error={error} /><div className="onboarding-grid"><form action={createHouseAction} className="choice-card"><span><Home size={23} /></span><h3>Create a house</h3><p>You’ll become the house owner.</p><label>House name<input name="name" placeholder="Sunrise House 402" required /></label><SubmitButton pendingLabel="Creating house…">Create house</SubmitButton></form><form action={joinHouseAction} className="choice-card"><span><Link2 size={23} /></span><h3>Join a house</h3><p>Use the invite code from your housemate.</p><label>Invite code<input name="inviteCode" placeholder="SUNRISE402" required /></label><SubmitButton className="button button--secondary" pendingLabel="Joining house…">Join house</SubmitButton></form></div></div>;
}
