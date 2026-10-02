import { Bell, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHeader({ eyebrow, title, description, action, unread }: { eyebrow?: string; title: string; description: string; action?: { href: string; label: string; icon?: LucideIcon }; unread?: number }) {
  const Icon = action?.icon;
  return (
    <header className="page-header">
      <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>
      {(action || unread !== undefined) && <div className="page-header__actions">{action && <Button asChild className="button"><Link href={action.href}>{Icon && <Icon size={18} />}{action.label}</Link></Button>}{unread !== undefined && <Link className="header-unread" href="/notifications" aria-label={`${unread} unread notifications`}><Bell size={13} /><strong>{unread}</strong></Link>}</div>}
    </header>
  );
}
