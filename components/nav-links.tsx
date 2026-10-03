"use client";

import { Bell, ClipboardCheck, LayoutDashboard, Leaf, Menu, Settings, UserRound, Users, WalletCards, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

export function MobileMenu({ unread }: { unread: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const close = () => setOpen(false);

  return <>
    <button type="button" className="mobile-menu-trigger" aria-label="Open navigation menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Menu size={19} aria-hidden="true" />
    </button>
    {open && <div className="mobile-menu-layer">
      <button type="button" className="mobile-menu-backdrop" aria-label="Close navigation menu" onClick={close} />
      <aside className="mobile-menu-panel" aria-label="All navigation">
        <div className="mobile-menu-panel__header"><strong>Menu</strong><button type="button" className="mobile-menu-close" aria-label="Close navigation menu" onClick={close}><X size={19} aria-hidden="true" /></button></div>
        <nav className="mobile-menu-links" aria-label="All pages">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "active" : ""} onClick={close}><Icon size={19} aria-hidden="true" /><span>{label}</span></Link>)}
          <div className="mobile-menu-divider" />
          <Link href="/notifications" className={isActive("/notifications") ? "active" : ""} onClick={close}><Bell size={19} aria-hidden="true" /><span>Notifications</span>{unread > 0 && <em>{unread}</em>}</Link>
          {accountLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "active" : ""} onClick={close}><Icon size={19} aria-hidden="true" /><span>{label}</span></Link>)}
        </nav>
      </aside>
    </div>}
  </>;
}
