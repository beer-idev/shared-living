import type { Metadata } from "next";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { getNotifications } from "@/lib/data";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [items, query] = await Promise.all([getNotifications(), searchParams]);
  const unread = items.filter((item) => !item.read_at).length;
  return <div className="figma-notifications"><PageHeader title="Notifications" description="Stay up to date with what is happening at home" unread={unread} /><StatusMessage error={query.error} />{items.length === 0 ? <EmptyState icon={Bell} title="You’re all caught up" description="New bills, tasks and harmony milestones will appear here." /> : <section>{items.map((item) => <Link href={item.href || "/dashboard"} key={item.id} className={!item.read_at ? "is-unread" : ""}><strong>{item.title}</strong><span>{item.body}</span><small>{relativeTime(item.created_at)}</small></Link>)}{unread > 0 && <form action={markAllNotificationsReadAction}><button className="button button--soft"><CheckCheck size={16} /> Mark all read</button></form>}</section>}</div>;
}
