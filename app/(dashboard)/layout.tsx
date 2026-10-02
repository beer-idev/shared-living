import { AppShell } from "@/components/app-shell";
import { getAppContext, getNotifications } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [context, notifications] = await Promise.all([getAppContext(), getNotifications()]);
  return <AppShell context={context} unread={notifications.filter((item) => !item.read_at).length}>{children}</AppShell>;
}
