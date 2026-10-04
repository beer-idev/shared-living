import type { Metadata } from "next";
import { Heart, ListChecks, WalletCards } from "lucide-react";
import { updateProfileAction } from "@/app/actions/house";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppContext, getExpenses, getMemberStats, getNotifications } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [context, stats, expenses, notifications, query] = await Promise.all([getAppContext(), getMemberStats(), getExpenses(), getNotifications(), searchParams]);
  const member = context.members.find((item) => item.user_id === context.userId);
  const memberStats = stats[context.userId] ?? { chores: 0, bills: 0, thanks: 0 };
  const points = member?.points ?? 0;
  const paidForHouse = expenses
    .flatMap((expense) => expense.splits ?? [])
    .filter((split) => split.user_id === context.userId && split.is_paid)
    .reduce((total, split) => total + split.amount, 0);

  return <div>
    <PageHeader title="Profile" description="How you show up for the house" unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} success={query.saved ? "Your profile has been updated." : undefined} />
    <div className="grid items-start gap-5 xl:grid-cols-[350px_minmax(0,1fr)]">
      <Card>
        <CardContent className="flex min-h-[470px] flex-col items-center p-6 text-center sm:p-8">
          <div className="relative mt-1 [&_.avatar]:!size-24 [&_.avatar]:!text-2xl"><Avatar profile={context.profile} size="lg" /></div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#17291f]">{context.profile.display_name}</h2>
          <p className="mt-1 text-sm text-[#718187]">{member?.role === "owner" ? "Owner" : "Member"}{member?.joined_at ? ` · joined ${formatDate(member.joined_at, { month: "short", year: "numeric" })}` : ""}</p>
          <strong className="mt-9 text-4xl font-bold tabular-nums text-[#248a3e]">{points}</strong>
          <span className="mt-1 text-xs text-[#718187]">system points</span>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="px-5 pb-0 pt-5 sm:px-6 sm:pt-6"><CardTitle className="text-xl">Your contribution</CardTitle></CardHeader>
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[18px] bg-[#f1f7f7] p-4"><ListChecks className="size-[18px] text-[#4cbd5b]" aria-hidden="true" /><span className="mt-3 block text-xs text-[#718187]">Tasks completed</span><strong className="mt-1 block text-xl tabular-nums text-[#17291f]">{memberStats.chores}</strong></article>
            <article className="rounded-[18px] bg-[#f1f7f7] p-4"><WalletCards className="size-[18px] text-[#4cbd5b]" aria-hidden="true" /><span className="mt-3 block text-xs text-[#718187]">Paid for the house</span><strong className="mt-1 block text-xl tabular-nums text-[#17291f]">{formatMoney(paidForHouse, context.house.currency)}</strong></article>
            <article className="rounded-[18px] bg-[#f1f7f7] p-4"><Heart className="size-[18px] text-[#4cbd5b]" aria-hidden="true" /><span className="mt-3 block text-xs text-[#718187]">Reactions received</span><strong className="mt-1 block text-xl tabular-nums text-[#17291f]">{memberStats.thanks}</strong></article>
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold text-[#17291f]">Personal details</h3>
          <form action={updateProfileAction} className="grid gap-4">
            <input type="hidden" name="returnTo" value="/profile" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="display-name">Display name</Label><Input id="display-name" name="displayName" defaultValue={context.profile.display_name} autoComplete="name" required /></div>
              <div className="grid gap-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" type="email" value={context.email} readOnly className="bg-[#f7f9f9]" /></div>
            </div>
            <SubmitButton className="w-full sm:w-fit" pendingLabel="Saving changes…">Save changes</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>;
}
