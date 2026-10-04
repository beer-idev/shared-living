import Link from "next/link";
import { redirect } from "next/navigation";
import { joinHouseAction } from "@/app/actions/house";
import { Brand } from "@/components/brand";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { currentUser, isFirebaseConfigured } from "@/lib/firebase/server";
import { houseByCode } from "@/lib/firebase/store";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized.length > 32) redirect("/onboarding?error=Invalid+invite+link");
  if (!isFirebaseConfigured) redirect("/setup");

  const [house, user] = await Promise.all([houseByCode(normalized), currentUser()]);
  if (!house) redirect("/onboarding?error=Invite+link+is+invalid");
  const next = `/join/${normalized}`;

  return <main className="invite-page">
    <Brand />
    <section className="invite-panel">
      <p className="eyebrow">House invitation</p>
      <h1>Join {house.name}</h1>
      <p>Share bills, chores and updates with your housemates.</p>
      {user ? <form action={joinHouseAction}>
        <input type="hidden" name="inviteCode" value={normalized} />
        <SubmitButton className="button button--primary button--wide" pendingLabel="Joining house…">Join house</SubmitButton>
      </form> : <div className="grid gap-3">
        <Button asChild className="button button--primary button--wide"><Link href={`/register?next=${encodeURIComponent(next)}`}>Join house</Link></Button>
        <p className="text-center text-xs text-[#718187]">Already have an account? <Link className="font-semibold text-[#246f34] underline" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
      </div>}
    </section>
  </main>;
}
