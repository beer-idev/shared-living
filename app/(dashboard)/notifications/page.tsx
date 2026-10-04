import type { Metadata } from "next";
import { Bell, CheckCheck } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/notifications";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { getNotifications } from "@/lib/data";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ error?: string; read?: string }> }) {
  const [items, query] = await Promise.all([getNotifications(), searchParams]);
  const unread = items.filter((item) => !item.read_at).length;
  return <div className="figma-notifications"><PageHeader title="Notifications" description="Stay up to date with what is happening at home" unread={unread} /><StatusMessage error={query.error} success={query.read === "all" ? "All notifications marked as read." : undefined} />{items.length === 0 ? <EmptyState icon={Bell} title="You’re all caught up" description="New bills, tasks and harmony milestones will appear here." /> : <section aria-label="Notification history">{items.map((item) => <form action={markNotificationReadAction.bind(null, item.id)} key={item.id} className={`notification-center-item ${item.read_at ? "is-read" : "is-unread"}`}><button type="submit" aria-label={`${item.read_at ? "Open" : "Read and open"} notification: ${item.title}`}><span className="notification-center-item__heading"><strong>{item.title}</strong>{!item.read_at && <span className="notification-center-item__new">New</span>}</span>{item.body && <span className="notification-center-item__body">{item.body}</span>}<small>{relativeTime(item.created_at)}</small></button></form>)}{unread > 0 && <form action={markAllNotificationsReadAction} className="notification-mark-all"><button className="button button--soft"><CheckCheck size={16} aria-hidden="true" /> Mark all read</button></form>}</section>}</div>;
}
