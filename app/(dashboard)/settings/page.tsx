import type { Metadata } from "next";
import { DoorOpen, Globe2, LogOut, Settings2, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { updateHouseAction, updateNotificationPreferencesAction } from "@/app/actions/house";
import { NotificationPreferences } from "@/components/notification-preferences";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppContext, getNotifications } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

const selectClass = "h-11 w-full rounded-xl border border-[#dbe4e7] bg-white px-3 text-sm text-[#17291f] shadow-sm outline-none transition focus-visible:border-[#4cbd5b] focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/20 disabled:cursor-not-allowed disabled:bg-[#f4f7f7] disabled:text-[#718187]";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [context, notifications, query] = await Promise.all([getAppContext(), getNotifications(), searchParams]);
  const owner = context.members.some((member) => member.user_id === context.userId && member.role === "owner");

  return <div>
    <PageHeader title="Settings" description="Tune how the house works for everyone" unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} success={query.saved ? "Your changes have been saved." : undefined} />
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#e4ebed] px-5 py-5 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base"><Settings2 className="size-[18px] text-[#2e8d41]" aria-hidden="true" />House</CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <form action={updateHouseAction} className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor="house-name">House name</Label><Input id="house-name" name="houseName" defaultValue={context.house.name} disabled={!owner} required /></div>
            <div className="grid gap-2"><Label htmlFor="currency">Currency</Label><select id="currency" className={selectClass} name="currency" defaultValue={context.house.currency} disabled={!owner}><option value="THB">THB ฿</option><option value="USD">USD $</option><option value="EUR">EUR €</option></select></div>
            <div className="grid gap-2"><Label htmlFor="language">Language</Label><Input id="language" value="English" readOnly className="bg-[#f7f9f9]" /></div>
            {owner && <SubmitButton className="mt-1 w-full" pendingLabel="Saving…">Save house settings</SubmitButton>}
          </form>
          <div className="mt-5 divide-y divide-[#e4ebed] border-t border-[#e4ebed]">
            <Link href="/members" className="flex min-h-14 items-center gap-3 py-2 text-sm font-semibold text-[#17291f] transition hover:text-[#2d8b3f] focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/35"><span className="grid size-9 place-items-center rounded-full bg-[#dff6e3] text-[#267b39]"><Users className="size-4" aria-hidden="true" /></span>Manage members<span className="ml-auto text-[#718187]">{context.members.length}</span></Link>
            <div className="flex min-h-14 items-center gap-3 py-2"><span className="grid size-9 place-items-center rounded-full bg-[#dff6e3] text-[#267b39]"><WalletCards className="size-4" aria-hidden="true" /></span><div><strong className="block text-sm">House currency</strong><span className="text-xs text-[#718187]">Used across expenses and debts</span></div><b className="ml-auto text-sm">{context.house.currency}</b></div>
            <div className="flex min-h-14 items-center gap-3 py-2"><span className="grid size-9 place-items-center rounded-full bg-[#dff6e3] text-[#267b39]"><Globe2 className="size-4" aria-hidden="true" /></span><div><strong className="block text-sm">Language</strong><span className="text-xs text-[#718187]">Interface language</span></div><b className="ml-auto text-sm">English</b></div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#e4ebed] px-5 py-5 sm:px-6"><CardTitle className="text-base">Notifications & privacy</CardTitle></CardHeader>
        <CardContent className="p-5 sm:p-6">
          <NotificationPreferences action={updateNotificationPreferencesAction} values={{ taskReminders: context.profile.task_reminders, billAlerts: context.profile.bill_alerts, houseActivity: context.profile.house_activity }} />
          <div className="mt-4 flex flex-col gap-2 border-t border-[#dfe7e9] pt-4 sm:flex-row sm:flex-wrap">
            <Button asChild variant="outline" className="w-full sm:w-auto"><Link href="/notifications"><DoorOpen aria-hidden="true" />Notification center</Link></Button>
            <Button asChild variant="ghost" className="w-full sm:w-auto"><Link href="/profile">Edit profile</Link></Button>
            <form action={signOutAction} className="sm:ml-auto"><Button variant="ghost" type="submit" className="w-full text-[#bf3445] hover:bg-[#fff0f2] hover:text-[#a72a3a] sm:w-auto"><LogOut aria-hidden="true" />Sign out</Button></form>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>;
}
