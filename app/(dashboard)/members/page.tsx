import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { removeMemberAction } from "@/app/actions/house";
import { Avatar } from "@/components/avatar";
import { CopyInviteButton } from "@/components/copy-invite";
import { InviteMembersModal } from "@/components/invite-members-modal";
import { PageHeader } from "@/components/page-header";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { StatusMessage } from "@/components/status-message";
import { TreeIllustration } from "@/components/tree-illustration";
import { getAppContext, getExpenseSummary, getMemberStats, getNotifications, getTasks } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ error?: string; removed?: string }> }) {
  const [context, stats, summary, tasks, notifications, query] = await Promise.all([getAppContext(), getMemberStats(), getExpenseSummary(), getTasks(), getNotifications(), searchParams]);
  const isOwner = context.members.some((member) => member.user_id === context.userId && member.role === "owner");
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  return <div className="figma-members">
    <PageHeader title="Members" description={`${context.house.name} · A home we look after together`} action={{ href: "#invite", label: "Invite", icon: Plus }} unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} success={query.removed ? "The housemate was removed. Past records are unchanged." : undefined} />
    <section className="figma-house-card" id="invite">
      <TreeIllustration />
      <div className="member-house-content">
        <h2>{context.house.name}</h2>
        <p>{context.members.length} members sharing expenses, chores and everyday life.</p>
        <div className="member-house-stats"><span><small>Members</small><strong>{context.members.length}</strong></span><span><small>Tracked this month</small><strong>{formatMoney(summary.total, context.house.currency)}</strong></span><span><small>Tasks done</small><strong>{completedTasks}</strong></span><span><small>Harmony</small><strong>{context.house.harmony_score}</strong></span></div>
        <label>Invite link<span>{`/join/${context.house.invite_code}`}</span></label>
        <div className="invite-actions"><InviteMembersModal code={context.house.invite_code} houseName={context.house.name} /><CopyInviteButton code={context.house.invite_code} /></div>
      </div>
    </section>
    <section className="figma-member-grid">{context.members.map((member, index) => { const memberStats = stats[member.user_id] ?? { chores: 0, bills: 0, thanks: 0 }; const bonus = memberStats.thanks * 5; return <article key={member.user_id}><Avatar profile={member.profile} index={index} size="lg" /><h2>{member.profile.display_name}</h2><p>{member.role === "owner" ? "Owner" : "Member"}</p><strong>{member.points}</strong><small>{Math.max(0, member.points - bonus)} system + {bonus} bonus</small>{isOwner && member.user_id !== context.userId ? <RemoveMemberButton name={member.profile.display_name} memberId={member.user_id} action={removeMemberAction} /> : <span>House owner</span>}</article>; })}</section>
    <p className="figma-footnote">Past expense and task records stay available when a member is removed.</p>
  </div>;
}
