"use client";

import { Bell, ClipboardCheck, LayoutDashboard, Leaf, Settings, UserRound, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", short: "Expenses", icon: WalletCards },
  { href: "/chores", label: "Tasks", short: "Tasks", icon: ClipboardCheck },
  { href: "/harmony", label: "House Harmony", short: "Harmony", icon: Leaf },
  { href: "/members", label: "Members", short: "People", icon: Users },
];

const accountLinks = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="desktop-nav" aria-label="Primary navigation">
      <span className="nav-label">Your space</span>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={20} /><span>{label}</span></Link>;
      })}
      {accountLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={20} /><span>{label}</span></Link>;
      })}
    </nav>
  );
}

export function SecondaryNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav className="secondary-nav" aria-label="Account navigation">
      <Link href="/notifications" className={pathname.startsWith("/notifications") ? "active" : ""}><Bell size={19} /><span>Notifications</span>{unread > 0 && <em>{unread}</em>}</Link>
      <Link href="/profile" className={pathname.startsWith("/profile") ? "active" : ""}><UserRound size={19} /><span>Profile</span></Link>
      <Link href="/settings" className={pathname.startsWith("/settings") ? "active" : ""}><Settings size={19} /><span>Settings</span></Link>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {links.map(({ href, short, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={20} /><span>{short}</span></Link>;
      })}
    </nav>
  );
}
