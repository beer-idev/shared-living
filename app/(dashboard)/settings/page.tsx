import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { updateHouseAction, updateNotificationPreferencesAction } from "@/app/actions/house";
import { NotificationPreferences } from "@/components/notification-preferences";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { getAppContext, getNotifications } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [context, notifications, query] = await Promise.all([getAppContext(), getNotifications(), searchParams]);
  const owner = context.members.some((member) => member.user_id === context.userId && member.role === "owner");
  return <div className="figma-settings"><PageHeader title="Settings" description="Tune how the house works for everyone" unread={notifications.filter((item) => !item.read_at).length} /><StatusMessage error={query.error} success={query.saved ? "Your changes have been saved." : undefined} /><div className="figma-settings-layout"><section><h2>House</h2><form action={updateHouseAction}><label>House name<input name="houseName" defaultValue={context.house.name} disabled={!owner} required /></label><label>Currency<select name="currency" defaultValue={context.house.currency} disabled={!owner}><option value="THB">THB ฿</option><option value="USD">USD $</option><option value="EUR">EUR €</option></select></label><label>Language<input value="English" readOnly /></label>{owner && <SubmitButton className="button button--soft" pendingLabel="Saving…">Save house settings</SubmitButton>}</form><Link className="button button--soft button--wide" href="/members">Manage members</Link></section><section><h2>Notifications</h2><NotificationPreferences action={updateNotificationPreferencesAction} values={{ taskReminders: context.profile.task_reminders, billAlerts: context.profile.bill_alerts, houseActivity: context.profile.house_activity }} /><Link className="button button--soft button--wide" href="/notifications">Open notification center</Link><Link className="button button--soft" href="/profile">Edit profile</Link><form action={signOutAction}><button className="button button--soft" type="submit">Sign out</button></form></section></div></div>;
}
