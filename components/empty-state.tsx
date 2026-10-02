import { Inbox, type LucideIcon } from "lucide-react";
import Link from "next/link";

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: LucideIcon; title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="empty-state"><span><Icon size={25} /></span><h2>{title}</h2><p>{description}</p>{action && <Link href={action.href} className="button button--secondary">{action.label}</Link>}</div>;
}
