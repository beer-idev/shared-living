import { Bell, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHeader({ eyebrow, title, description, action, actionSlot, unread }: { eyebrow?: string; title: string; description: string; action?: { href: string; label: string; icon?: LucideIcon }; actionSlot?: ReactNode; unread?: number }) {
  const Icon = action?.icon;
  return (
    <header className="-mx-3 mb-7 flex min-h-[88px] items-center justify-between gap-4 border-b border-[#dbe4e7] bg-[#f8fafb] px-3 py-4 sm:-mx-[18px] sm:px-[18px] lg:-mx-8 lg:px-8">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-[#3b9f4b]">{eyebrow}</p>}
        <h1 className="text-balance text-2xl font-bold tracking-[-.035em] text-[#17291f] sm:text-[28px]">{title}</h1>
        <p className="mt-1 text-sm leading-5 text-[#687c82]">{description}</p>
      </div>
      {(action || actionSlot || unread !== undefined) && <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {actionSlot}
        {action && <Button asChild className="min-h-11 shadow-[0_8px_20px_rgba(76,189,91,.18)]"><Link href={action.href}>{Icon && <Icon aria-hidden="true" />}{action.label}</Link></Button>}
        {unread !== undefined && <Button asChild variant="ghost" size="icon" className="relative size-11" aria-label={`${unread} unread notifications`}><Link href="/notifications"><Bell aria-hidden="true" />{unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[#4cbd5b] ring-2 ring-[#f8fafb]" />}</Link></Button>}
      </div>}
    </header>
  );
}
