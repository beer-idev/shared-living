import type { Metadata } from "next";
import { CircleCheck, Clock3, Plus, TrendingDown, WalletCards } from "lucide-react";
import Link from "next/link";
import { markSplitPaidAction } from "@/app/actions/expenses";
import { EmptyState } from "@/components/empty-state";
import { ExpenseDetailModal } from "@/components/expense-detail-modal";
import { ExpenseFilters } from "@/components/expense-filters";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { getAppContext, getExpenses, getExpenseSummary, getHouseDebts, getNotifications } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Expenses" };

type StatusFilter = "all" | "pending" | "settled";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ error?: string; paid?: string; view?: string; status?: string }> }) {
  const [query, context, expenses, summary, debts, notifications] = await Promise.all([searchParams, getAppContext(), getExpenses(), getExpenseSummary(), getHouseDebts(), getNotifications()]);
  const isHistory = query.view === "history";
  const status: StatusFilter = query.status === "pending" || query.status === "settled" ? query.status : "all";
  const getSettled = (expense: (typeof expenses)[number]) => Boolean(expense.splits?.length && expense.splits.every((split) => split.is_paid));
  const settledCount = expenses.filter(getSettled).length;
  const pendingCount = expenses.length - settledCount;
  const visibleExpenses = expenses.filter((expense) => status === "all" || (status === "settled" ? getSettled(expense) : !getSettled(expense)));

  return <div className="figma-expenses">
    <PageHeader title={isHistory ? "Expense history" : "Expenses"} description={isHistory ? "Every shared cost in one place" : "Shared bills, equal splits, clear balances"} action={{ href: "/expenses/new", label: "New expense", icon: Plus }} unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} success={query.paid === "1" ? "Your share has been marked as paid." : undefined} />
    <section className="figma-expense-stats"><article><i><WalletCards size={18} /></i><span>Monthly expense</span><strong>{formatMoney(summary.total, context.house.currency)}</strong></article><article><i><TrendingDown size={18} /></i><span>Total debt</span><strong>{formatMoney(summary.owed, context.house.currency)}</strong></article><article><i><CircleCheck size={18} /></i><span>Paid bills</span><strong>{settledCount}</strong></article><article><i><Clock3 size={18} /></i><span>Pending bills</span><strong>{pendingCount}</strong></article></section>
    <ExpenseFilters status={status} isHistory={isHistory} />
    {expenses.length === 0 ? <EmptyState title="No expenses yet" description="Add your first shared bill and split it with the house." action={{ href: "/expenses/new", label: "Add expense" }} /> : isHistory ? <section className="figma-expense-history"><h2>Monthly total · {formatMoney(summary.total, context.house.currency)}</h2><div className="figma-expense-table"><div><b>Date</b><b>Expense</b><b>Category</b><b>Amount</b><b>Status</b></div>{visibleExpenses.map((expense) => { const settled = getSettled(expense); return <Link href={`/expenses/${expense.id}`} key={expense.id}><span>{formatDate(expense.expense_date, { day: "numeric", month: "short" })}</span><strong>{expense.title}</strong><span>{expense.category}</span><strong>{formatMoney(expense.amount, context.house.currency)}</strong><em className={settled ? "is-settled" : ""}>{settled ? "Settled" : "Pending"}</em></Link>; })}</div>{visibleExpenses.length === 0 && <p className="expense-empty-filter">No expenses match this status.</p>}</section> : <div className="figma-expense-layout"><section className="figma-expense-grid">{visibleExpenses.map((expense) => { const settled = getSettled(expense); const memberCount = expense.splits?.length || context.members.length; const currentSplit = expense.splits?.find((split) => split.user_id === context.userId); const allSettled = settled; const mySharePaid = Boolean(currentSplit?.is_paid); const statusLabel = allSettled ? "Settled" as const : mySharePaid ? "Your share paid" as const : "Pending" as const; const dateLabel = formatDate(expense.expense_date, { month: "long", year: "numeric" }); return <article key={expense.id}><header><div><ExpenseDetailModal trigger="title" title={expense.title} category={expense.category} date={formatDate(expense.expense_date)} total={formatMoney(expense.amount, context.house.currency)} perPerson={formatMoney(expense.amount / memberCount, context.house.currency)} paidBy={expense.payer.display_name} members={memberCount} status={statusLabel} /><p>{expense.category} · {dateLabel}</p></div><strong>{formatMoney(expense.amount, context.house.currency)}</strong></header><p>Paid by <b>{expense.payer.display_name}</b> · {memberCount} members</p><b>{formatMoney(expense.amount / memberCount, context.house.currency)} per person</b><footer className={currentSplit && !currentSplit.is_paid ? "has-action" : "is-status-only"}><span className={allSettled || mySharePaid ? "is-settled" : "is-pending"}><Clock3 size={13} /> {statusLabel}</span>{currentSplit && !currentSplit.is_paid && <form action={markSplitPaidAction}><input type="hidden" name="splitId" value={currentSplit.id} /><input type="hidden" name="expenseId" value={expense.id} /><button type="submit" className="expense-card__pay-button">Mark as paid</button></form>}</footer></article>; })}{visibleExpenses.length === 0 && <p className="expense-empty-filter">No expenses match this status.</p>}</section><aside className="figma-debt-aside"><h2>Debt summary</h2><p>Who owes what right now</p>{debts.map((debt) => <div key={debt.userId}><span>{debt.name}</span><strong>{formatMoney(debt.amount, context.house.currency)}</strong></div>)}<small>Payments update only the member&apos;s share.</small></aside></div>}
  </div>;
}
