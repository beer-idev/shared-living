import type { Metadata } from "next";
import { Heart, ListChecks, WalletCards } from "lucide-react";
import { updateProfileAction } from "@/app/actions/house";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { getAppContext, getExpenses, getMemberStats, getNotifications } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [context, stats, expenses, notifications, query] = await Promise.all([getAppContext(), getMemberStats(), getExpenses(), getNotifications(), searchParams]);
  const member = context.members.find((item) => item.user_id === context.userId);
  const memberStats = stats[context.userId] ?? { chores: 0, bills: 0, thanks: 0 };
  const points = member?.points ?? 0;
  const paidForHouse = expenses.filter((expense) => expense.paid_by === context.userId).reduce((total, expense) => total + expense.amount, 0);
  const nextBadge = Math.ceil((points + 1) / 500) * 500;
  const progress = Math.min(100, Math.round((points / nextBadge) * 100));

  return <div className="figma-profile">
    <PageHeader title="Profile" description="How you show up for the house" unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} success={query.saved ? "Your username has been updated." : undefined} />
    <div className="figma-profile-layout">
      <aside className="profile-identity">
        <div className="profile-avatar-wrap"><Avatar profile={context.profile} size="lg" /><span className="profile-camera" aria-hidden="true">+</span></div>
        <h2>{context.profile.display_name}</h2>
        <p>{member?.role === "owner" ? "Owner" : "Member"} · joined Jan 2026</p>
        <strong>{points}</strong><small>system points</small>
        <div className="profile-progress"><span style={{ width: `${progress}%` }} /></div>
        <p className="profile-progress-copy">{Math.max(0, nextBadge - points)} points to the next badge</p>
      </aside>
      <section className="profile-contribution-panel">
        <h2>Your contribution</h2>
        <div className="profile-contribution-stats">
          <article><ListChecks size={16} /><span>Tasks completed</span><strong>{memberStats.chores}</strong></article>
          <article><WalletCards size={16} /><span>Paid for the house</span><strong>{formatMoney(paidForHouse, context.house.currency)}</strong></article>
          <article><Heart size={16} /><span>Reactions received</span><strong>{memberStats.thanks}</strong></article>
        </div>
        <h3>Badges</h3>
        <div className="profile-badges"><span>🧽 Clean Freak</span><span>💸 Bill Hero</span><span>🌱 Tree Grower</span><span>🤝 Team Player</span><span>🔥 7-day streak</span></div>
        <h3>Personal details</h3>
        <form action={updateProfileAction}>
          <input type="hidden" name="returnTo" value="/profile" />
          <div className="profile-form-grid">
            <label>Display name<input name="displayName" defaultValue={context.profile.display_name} required /></label>
            <label>Email<input value={context.email} readOnly /></label>
            <label>Phone<input value="+66 81 234 5678" readOnly /></label>
            <label>Preferred payment<input value="PromptPay" readOnly /></label>
          </div>
          <SubmitButton pendingLabel="Saving changes…">Save changes</SubmitButton>
        </form>
      </section>
    </div>
  </div>;
}
