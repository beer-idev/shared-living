import type { Metadata } from "next";
import { Bell, CheckCircle2, ListChecks, PartyPopper, Plus, Sprout, TrendingDown, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { markNotificationReadAction } from "@/app/actions/notifications";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { TreeIllustration } from "@/components/tree-illustration";
import { Card } from "@/components/ui/card";
import { getAppContext, getExpenseSummary, getHouseDebts, getNotifications, getTasks, getUpcomingCelebration } from "@/lib/data";
import { formatMoney, harmonyLevel } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [context, summary, debts, tasks, notifications, celebration] = await Promise.all([
    getAppContext(), getExpenseSummary(), getHouseDebts(), getTasks(), getNotifications(), getUpcomingCelebration(),
  ]);
  const pending = tasks.filter((task) => task.status === "pending");
  const unread = notifications.filter((item) => !item.read_at).length;
  const level = harmonyLevel(context.house.harmony_score);
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date());
  const maxDebt = Math.max(...debts.map((item) => item.amount), 1);

  return <div className="figma-dashboard lovable-dashboard">
    <PageHeader title={`Good morning, ${context.profile.display_name.split(" ")[0]} 👋`} description={`${context.house.name} · ${context.members.length} members`} action={{ href: "/expenses/new", label: "Add expense", icon: Plus }} unread={unread} />
    <section className="figma-stats">
      <article className="is-green"><i><WalletCards size={21} /></i><span>Monthly expense</span><strong>{formatMoney(summary.total, context.house.currency)}</strong><small>{month}</small></article>
      <article className="is-pink"><i><TrendingDown size={21} /></i><span>Your debt</span><strong>{formatMoney(summary.owed, context.house.currency)}</strong><small>{summary.owedCount} unsettled bills</small></article>
      <article className="is-orange"><i><ListChecks size={21} /></i><span>Pending tasks</span><strong>{pending.length}</strong><small>{pending.slice(0, 2).length} due today</small></article>
      <article className="is-blue"><i><PartyPopper size={21} /></i><span>Upcoming celebration</span><strong>{celebration?.title ?? level.name}</strong><small>{celebration ? "A reason to get together" : "Keep growing together"}</small></article>
    </section>
    <section className="figma-dashboard__middle">
      <article className="figma-harmony-card"><header><h2>House Harmony</h2><em>{level.name}</em></header><TreeIllustration /><strong>{level.name}</strong><div className="harmony-score-line"><b>{context.house.harmony_score} / 100</b><small>Next: keep growing</small></div><div className="harmony-meter"><span style={{ width: `${context.house.harmony_score}%` }} /></div><Link href="/harmony"><Sprout size={16} /> Open harmony</Link></article>
      <article className="figma-debt-card"><header><h2>Debt summary</h2><Link href="/expenses">View all</Link></header><div>{debts.map((debt, index) => <div key={debt.userId}><Avatar profile={context.members.find((member) => member.user_id === debt.userId)?.profile ?? context.profile} index={index} size="md" /><span><strong>{debt.name}</strong><small>Owes the house</small></span><b>{formatMoney(debt.amount, context.house.currency)}</b><i><i style={{ width: `${Math.max(8, (debt.amount / maxDebt) * 100)}%` }} /></i></div>)}</div></article>
    </section>
    <section className="figma-dashboard__bottom">
      <article className="dashboard-list"><header><h2>Pending tasks</h2><Link href="/chores">All tasks</Link></header>{pending.slice(0, 4).map((task) => <Link className="dashboard-task" href={`/chores?task=${task.id}`} key={task.id}><span><CheckCircle2 size={16} /></span><div><strong>{task.title}</strong><small>{task.assignee?.display_name ?? "Unassigned"} · {new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(new Date(task.due_at))}</small></div><em>+10</em></Link>)}</article>
      <article className="dashboard-list dashboard-list--notifications"><header><h2>Notifications</h2><Link href="/notifications">View all</Link></header>{notifications.slice(0, 6).map((item) => <form action={markNotificationReadAction.bind(null, item.id)} key={item.id} className="dashboard-notification-form"><button type="submit" className={`dashboard-notification ${item.read_at ? "is-read" : "is-unread"}`} aria-label={`${item.read_at ? "Open" : "Read and open"} notification: ${item.title}`}><Bell size={15} aria-hidden="true" /><span><strong>{item.title}</strong>{item.body && <small>{item.body}</small>}</span>{!item.read_at && <em>New</em>}</button></form>)}</article>
    </section>
    <section className="mt-5"><Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="m-0 text-lg font-semibold text-[#17291f]">House members</h2><p className="mt-1 text-sm text-[#718187]">Everyone sharing {context.house.name}</p></div>
        <Link href="/members" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#dbe4e7] bg-white px-4 text-sm font-semibold text-[#17291f] shadow-sm transition hover:bg-[#f3f8f8]"><Users size={16} /> Manage</Link>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {context.members.map((member, index) => <Link key={member.user_id} href="/members" className="inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-full border border-[#dbe4e7] bg-white px-4 py-2 transition hover:border-[#4cbd5b] hover:bg-[#f3faf4]"><Avatar profile={member.profile} index={index} size="sm" /><span><strong className="block text-sm font-semibold text-[#17291f]">{member.profile.display_name}</strong><small className="block text-xs text-[#718187]">{member.points} pts</small></span></Link>)}
      </div>
    </Card></section>
  </div>;
}
