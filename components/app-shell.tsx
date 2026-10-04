import { Bell, Sprout } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import type { AppContext } from "@/lib/types";
import { harmonyLevel } from "@/lib/format";
import { Avatar } from "./avatar";
import { Brand } from "./brand";
import { DesktopNav, MobileMenu, MobileNav } from "./nav-links";

export function AppShell({ context, unread, children }: { context: AppContext; unread: number; children: React.ReactNode }) {
  const harmony = harmonyLevel(context.house.harmony_score);
  const role = context.members.find((member) => member.user_id === context.userId)?.role === "owner" ? "Owner" : "Member";
  return (
    <div className="app-shell">
      <a className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#17291f] focus:not-sr-only focus:fixed focus:left-4 focus:top-4" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/dashboard"><span><Sprout size={19} /></span><div><strong>Shared Living</strong><small>Management System</small></div></Link>
        <Link className="house-switcher" href="/members">
          <strong>{context.house.name}</strong><small>{harmony.name} · {context.house.harmony_score}%</small><i><b style={{ width: `${context.house.harmony_score}%` }} /></i>
        </Link>
        <DesktopNav />
        <div className="sidebar__footer">
          <div className="sidebar-profile">
            <small>Signed in as</small><strong>{context.profile.display_name}</strong><span>{role}</span>
            <form action={signOutAction}><button type="submit">Sign out</button></form>
          </div>
        </div>
      </aside>
      <header className="mobile-header"><Brand compact /><div className="mobile-header__actions"><MobileMenu unread={unread} /><Link href="/notifications" className="notification-button" aria-label={`${unread} unread notifications`}><Bell size={19} aria-hidden="true" />{unread > 0 && <span aria-hidden="true">{unread}</span>}</Link><Link href="/profile" aria-label="Open profile"><Avatar profile={context.profile} size="sm" /></Link></div></header>
      <main id="main-content" className="main-content">{children}</main>
      <MobileNav />
    </div>
  );
}
