import type { Metadata } from "next";
import { Crown, ListChecks, Sprout, Users, WalletCards } from "lucide-react";
import { removeMemberAction } from "@/app/actions/house";
import { Avatar } from "@/components/avatar";
import { CopyInviteButton } from "@/components/copy-invite";
import { InviteMembersModal } from "@/components/invite-members-modal";
import { PageHeader } from "@/components/page-header";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { StatusMessage } from "@/components/status-message";
import { TreeIllustration } from "@/components/tree-illustration";
import { Card, CardContent } from "@/components/ui/card";
import { getAppContext, getExpenseSummary, getNotifications, getTasks } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ error?: string; removed?: string }> }) {
  const [context, summary, tasks, notifications, query] = await Promise.all([getAppContext(), getExpenseSummary(), getTasks(), getNotifications(), searchParams]);
  const isOwner = context.members.some((member) => member.user_id === context.userId && member.role === "owner");
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const statsItems = [
    { label: "Members", value: String(context.members.length), icon: Users },
    { label: "Tracked this month", value: formatMoney(summary.total, context.house.currency), icon: WalletCards },
    { label: "Tasks done", value: String(completedTasks), icon: ListChecks },
    { label: "Harmony", value: String(context.house.harmony_score), icon: Sprout },
  ];

  return <div>
    <PageHeader title="Members" description={`${context.house.name}${context.house.created_at ? ` · created ${formatDate(context.house.created_at, { month: "short", year: "numeric" })}` : ""}`} actionSlot={<InviteMembersModal code={context.house.invite_code} houseName={context.house.name} compact />} unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} success={query.removed ? "The housemate was removed. Past records are unchanged." : undefined} />

    <Card className="overflow-hidden">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-center lg:p-8">
        <div className="mx-auto w-40 lg:w-48 [&_.tree]:max-h-44"><TreeIllustration /></div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold tracking-tight text-[#17291f] sm:text-2xl">{context.house.name}</h2><span className="rounded-full bg-[#dff6e3] px-2.5 py-1 text-[11px] font-semibold text-[#246f34]">Thriving</span><span className="rounded-full border border-[#dbe4e7] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#53696d]">Healthy Tree</span></div>
          <p className="mt-1 text-sm text-[#718187]">{context.members.length} members sharing expenses, chores and good vibes.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{statsItems.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-[18px] bg-[#f2f7f7] p-3.5"><Icon className="size-4 text-[#4cbd5b]" aria-hidden="true" /><span className="mt-2 block text-[11px] text-[#718187]">{label}</span><strong className="mt-1 block text-base tabular-nums text-[#17291f]">{value}</strong></div>)}</div>
          <label className="mt-4 block text-xs font-semibold text-[#17291f]" htmlFor="house-invite-link">Invite link</label>
          <div className="mt-2 flex min-w-0 gap-2"><div id="house-invite-link" className="flex min-h-10 min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-[#dbe4e7] bg-white px-3 font-mono text-xs text-[#53696d] shadow-sm"><span className="truncate">/join/{context.house.invite_code}</span></div><CopyInviteButton code={context.house.invite_code} /></div>
        </div>
      </CardContent>
    </Card>

    <section aria-label="House members" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {context.members.map((member, index) => {
        return <Card key={member.user_id}><CardContent className="flex min-h-[260px] flex-col items-center p-5 text-center [&_.avatar]:!size-14 [&_.avatar]:!text-base">
          <Avatar profile={member.profile} index={index} size="lg" />
          <h2 className="mt-3 font-semibold text-[#17291f]">{member.profile.display_name}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#718187]">{member.role === "owner" && <Crown className="size-3.5 text-[#ef9b22]" aria-hidden="true" />}{member.role === "owner" ? "Owner" : "Member"}{member.joined_at ? ` · joined ${formatDate(member.joined_at, { month: "short", year: "numeric" })}` : ""}</p>
          <strong className="mt-4 text-2xl font-bold tabular-nums text-[#4cbd5b]">{member.points}</strong>
          <span className="text-xs text-[#718187]">system points</span>
          <div className="mt-auto w-full pt-4">
            {isOwner && member.user_id !== context.userId ? <RemoveMemberButton name={member.profile.display_name} memberId={member.user_id} action={removeMemberAction} /> : <span className="flex h-11 min-h-11 w-full items-center justify-center rounded-xl bg-[#4cbd5b] text-xs font-semibold text-white">House owner</span>}
          </div>
        </CardContent></Card>;
      })}
    </section>
    <p className="mt-4 text-xs leading-5 text-[#718187]">Removing a member never deletes their past expense or task records.</p>
  </div>;
}
