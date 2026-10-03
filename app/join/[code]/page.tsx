import type { Metadata } from "next";
import { ArrowRight, Home, LogIn, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { joinHouseAction } from "@/app/actions/house";
import { Brand } from "@/components/brand";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "House invitation" };

export default async function JoinPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  let house = { name: "Shared home", member_count: 0 };
  let signedIn = false;
  let previewUnavailable = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const [{ data: userData }, { data, error }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc("get_house_invite_preview", { code }).maybeSingle(),
    ]);
    if (!data && !error) notFound();
    if (data) {
      const preview = data as { name: string; member_count: number };
      house = { name: preview.name, member_count: Number(preview.member_count) };
    } else {
      previewUnavailable = true;
    }
    signedIn = Boolean(userData.user);
  }
  const returnTo = `/join/${encodeURIComponent(code)}`;
  return <main className="invite-page"><Brand /><section className="invite-panel"><span className="invite-panel__mark"><Home size={30} /></span><p className="eyebrow">House invitation</p><h1>You&apos;re invited to {house.name}</h1><p>Join the people you live with to share bills, chores and everyday house updates.</p><div className="invite-facts"><span><Users size={17} /><strong>{house.member_count || "A few"}</strong> current members</span><span><ShieldCheck size={17} /> Your records stay private to this house</span></div><StatusMessage error={query.error ?? (previewUnavailable ? "House details are temporarily unavailable, but you can still continue with this invite." : undefined)} />{signedIn ? <form action={joinHouseAction}><input type="hidden" name="inviteCode" value={code} /><input type="hidden" name="returnTo" value={returnTo} /><div className="grid gap-2"><Label htmlFor="display-name">Display name</Label><Input id="display-name" name="displayName" placeholder="How housemates will see you" required /></div><SubmitButton className="button button--primary button--wide" pendingLabel="Joining house…">Join house <ArrowRight size={17} /></SubmitButton></form> : <Link className="button button--primary button--wide" href={`/login?next=${encodeURIComponent(returnTo)}`}><LogIn size={17} /> Log in to join</Link>}<small>Invite code · {code.toUpperCase()}</small></section></main>;
}
