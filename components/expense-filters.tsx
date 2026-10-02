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

  return <div className="expense-filter-bar">
    <div className="expense-view-tabs" aria-label="Expense views">
      <Link className={!isHistory ? "active" : ""} href="/expenses">All expenses</Link>
      <Link className={isHistory ? "active" : ""} href="/expenses?view=history">History</Link>
    </div>
    <label className="expense-filter-select">
      <span>Status</span>
      <select aria-label="Filter expenses by status" value={status} disabled={pending} onChange={(event) => updateStatus(event.target.value as StatusFilter)}>
        <option value="all">All expenses</option>
        <option value="pending">Pending</option>
        <option value="settled">Settled</option>
      </select>
    </label>
  </div>;
}
