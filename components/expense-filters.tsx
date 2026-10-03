"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type StatusFilter = "all" | "pending" | "settled";

export function ExpenseFilters({ status, isHistory }: { status: StatusFilter; isHistory: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function updateStatus(value: StatusFilter) {
    const params = new URLSearchParams(isHistory ? { view: "history" } : undefined);
    if (value !== "all") params.set("status", value);
    startTransition(() => router.push(`/expenses?${params.toString()}`));
  }

  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <nav className="inline-flex w-fit rounded-full bg-[#edf3f3] p-1" aria-label="Expense views">
      <Link className={`flex min-h-9 items-center rounded-full px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/35 ${!isHistory ? "bg-white text-[#17291f] shadow-sm" : "text-[#64787e] hover:text-[#17291f]"}`} href="/expenses">All expenses</Link>
      <Link className={`flex min-h-9 items-center rounded-full px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/35 ${isHistory ? "bg-white text-[#17291f] shadow-sm" : "text-[#64787e] hover:text-[#17291f]"}`} href="/expenses?view=history">History</Link>
    </nav>
    <label className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#718187] sm:mr-2"><span>Status</span><select aria-label="Filter expenses by status" value={status} disabled={pending} onChange={(event) => updateStatus(event.target.value as StatusFilter)} className="h-10 min-w-0 flex-1 cursor-pointer rounded-xl border border-[#dbe4e7] bg-white px-3 text-sm text-[#17291f] outline-none focus-visible:border-[#4cbd5b] focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/20 disabled:opacity-60 sm:w-40 sm:flex-none"><option value="all">All expenses</option><option value="pending">Pending</option><option value="settled">Settled</option></select></label>
  </div>;
}
