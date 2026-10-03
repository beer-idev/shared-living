import type { Metadata } from "next";
import { CircleCheck, CircleDollarSign, Clock3, House, ReceiptText, ShoppingBasket, SprayCan, TrendingDown, WalletCards, Wifi, Zap } from "lucide-react";
import Link from "next/link";
import { markSplitPaidAction } from "@/app/actions/expenses";
import { Avatar } from "@/components/avatar";
import { CreateExpenseDialog } from "@/components/create-expense-dialog";
import { EmptyState } from "@/components/empty-state";
import { ExpenseDetailModal } from "@/components/expense-detail-modal";
import { ExpenseFilters } from "@/components/expense-filters";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAppContext, getExpenses, getExpenseSummary, getHouseDebts, getNotifications } from "@/lib/data";
import { formatDate, formatDateInput, formatMoney } from "@/lib/format";
import type { Expense } from "@/lib/types";

export const metadata: Metadata = { title: "Expenses" };
type StatusFilter = "all" | "pending" | "settled";
type PaymentState = "Pending" | "Partially paid" | "Settled";

function paymentState(expense: Expense): PaymentState {
  const splits = expense.splits ?? [];
  const paid = splits.filter((split) => split.is_paid).length;
  if (splits.length > 0 && paid === splits.length) return "Settled";
  if (paid > 0) return "Partially paid";
  return "Pending";
}

function categoryIcon(category: string) {
  if (category === "electricity") return Zap;
  if (category === "grocery") return ShoppingBasket;
  if (category === "internet") return Wifi;
  if (category === "rent") return House;
  if (category === "other") return SprayCan;
  return CircleDollarSign;
}

function statusClass(state: PaymentState | "Your share paid") {
  if (state === "Settled" || state === "Your share paid") return "bg-[#dff6e3] text-[#246f34]";
  if (state === "Partially paid") return "bg-[#e7f1ff] text-[#285f9a]";
  return "bg-[#fff0d7] text-[#8b5621]";
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ error?: string; paid?: string; view?: string; status?: string }> }) {
  const [query, context, expenses, summary, debts, notifications] = await Promise.all([searchParams, getAppContext(), getExpenses(), getExpenseSummary(), getHouseDebts(), getNotifications()]);
  const isHistory = query.view === "history";
  const status: StatusFilter = query.status === "pending" || query.status === "settled" ? query.status : "all";
  const settledCount = expenses.filter((expense) => paymentState(expense) === "Settled").length;
  const pendingCount = expenses.length - settledCount;
  const visibleExpenses = expenses.filter((expense) => status === "all" || (status === "settled" ? paymentState(expense) === "Settled" : paymentState(expense) !== "Settled"));
  const defaultDate = formatDateInput();
  const statItems = [
    { label: "Monthly expense", value: formatMoney(summary.total, context.house.currency), icon: WalletCards },
    { label: "Total debt", value: formatMoney(summary.owed, context.house.currency), icon: TrendingDown },
    { label: "Paid bills", value: String(settledCount), icon: CircleCheck },
    { label: "Pending bills", value: String(pendingCount), icon: Clock3 },
  ];

  return <div>
    <PageHeader title={isHistory ? "Expense history" : "Expenses"} description={isHistory ? "Every shared cost in one place" : "Shared bills, equal splits, zero awkward talks"} actionSlot={<CreateExpenseDialog members={context.members} currentUserId={context.userId} currency={context.house.currency} defaultDate={defaultDate} />} unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} success={query.paid === "1" ? "Your share has been marked as paid." : undefined} />

    <section aria-label="Expense summary" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statItems.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="p-5 sm:p-6"><span className="grid size-10 place-items-center rounded-full bg-[#dff6e3] text-[#267b39]"><Icon className="size-[18px]" aria-hidden="true" /></span><span className="mt-5 block text-sm text-[#718187]">{label}</span><strong className="mt-1 block text-2xl font-bold tabular-nums text-[#17291f]">{value}</strong></CardContent></Card>)}
    </section>

    <ExpenseFilters status={status} isHistory={isHistory} />
    {expenses.length === 0 ? <EmptyState title="No expenses yet" description="Add your first shared bill and split it with the house." action={{ href: "/expenses/new", label: "Add expense" }} /> : isHistory ?
      <Card><CardContent className="p-4 sm:p-6"><h2 className="mb-4 text-lg font-semibold text-[#17291f]">Monthly total · {formatMoney(summary.total, context.house.currency)}</h2>
        <div className="hidden min-h-12 grid-cols-[80px_minmax(180px,1.5fr)_1fr_120px_110px] items-center gap-3 rounded-xl bg-[#fff0d7] px-4 text-[11px] font-bold uppercase text-[#4d3c26] md:grid"><span>Date</span><span>Expense</span><span>Category</span><span>Amount</span><span>Status</span></div>
        <div className="divide-y divide-[#e1e9eb]">{visibleExpenses.map((expense) => {
          const state = paymentState(expense);
          return <Link href={`/expenses/${expense.id}`} key={expense.id} className="grid min-h-20 grid-cols-[1fr_auto] gap-x-3 gap-y-2 rounded-lg px-2 py-4 transition hover:bg-[#f7fafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/35 md:min-h-14 md:grid-cols-[80px_minmax(180px,1.5fr)_1fr_120px_110px] md:items-center md:gap-3 md:px-4 md:py-0">
            <span className="text-xs text-[#718187]">{formatDate(expense.expense_date, { day: "numeric", month: "short" })}</span><strong className="min-w-0 truncate text-sm text-[#17291f]">{expense.title}</strong><span className="text-xs capitalize text-[#718187] md:block">{expense.category}</span><strong className="text-right text-sm tabular-nums text-[#17291f] md:text-left">{formatMoney(expense.amount, context.house.currency)}</strong><em className={`col-span-2 w-fit rounded-full px-3 py-1.5 text-xs font-medium not-italic md:col-span-1 ${statusClass(state)}`}>{state}</em>
          </Link>;
        })}</div>
        {visibleExpenses.length === 0 && <p className="py-10 text-center text-sm text-[#718187]">No expenses match this status.</p>}
      </CardContent></Card> :
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,32%)]">
        <section aria-label="Expense cards" className="grid gap-4 md:grid-cols-2">{visibleExpenses.map((expense) => {
          const state = paymentState(expense);
          const memberCount = expense.splits?.length || context.members.length;
          const currentSplit = expense.splits?.find((split) => split.user_id === context.userId);
          const mySharePaid = Boolean(currentSplit?.is_paid);
          const cardStatus = state === "Settled" ? "Settled" : mySharePaid ? "Your share paid" : state;
          const Icon = categoryIcon(expense.category);
          return <Card key={expense.id}><CardContent className="flex min-h-[190px] flex-col p-5">
            <header className="flex min-w-0 items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-[#dff6e3] text-[#267b39]"><Icon className="size-[18px]" aria-hidden="true" /></span><div className="min-w-0"><ExpenseDetailModal title={expense.title} category={expense.category} date={formatDate(expense.expense_date)} total={formatMoney(expense.amount, context.house.currency)} perPerson={formatMoney(expense.amount / memberCount, context.house.currency)} paidBy={expense.payer.display_name} members={memberCount} status={cardStatus} /><p className="text-xs capitalize text-[#718187]">{expense.category} · {formatDate(expense.expense_date, { year: "numeric", month: "long" })}</p></div></div><strong className="shrink-0 text-base font-bold tabular-nums text-[#17291f]">{formatMoney(expense.amount, context.house.currency)}</strong></header>
            <div className="mt-5 flex min-w-0 items-center gap-3"><span className="text-xs text-[#718187]">Paid by <b className="text-[#17291f]">{expense.payer.display_name}</b></span><div className="ml-auto flex pl-2">{expense.splits?.slice(0, 4).map((split, index) => <span className="-ml-2 rounded-full border-2 border-white" key={split.id}><Avatar profile={split.profile} index={index} size="sm" /></span>)}</div><span className="shrink-0 text-xs text-[#718187]">{formatMoney(expense.amount / memberCount, context.house.currency)} each</span></div>
            <footer className="mt-auto flex items-center gap-3 pt-5"><span className={`inline-flex min-h-7 items-center gap-1 rounded-full px-3 text-xs font-medium ${statusClass(cardStatus)}`}><Clock3 className="size-3.5" aria-hidden="true" />{cardStatus}</span>{currentSplit && !currentSplit.is_paid && <form action={markSplitPaidAction} className="ml-auto"><input type="hidden" name="splitId" value={currentSplit.id} /><input type="hidden" name="expenseId" value={expense.id} /><Button type="submit" variant="secondary" size="sm">Mark as paid</Button></form>}</footer>
          </CardContent></Card>;
        })}{visibleExpenses.length === 0 && <p className="py-10 text-center text-sm text-[#718187] md:col-span-2">No expenses match this status.</p>}</section>
        <Card className="xl:sticky xl:top-5"><CardContent className="p-5 sm:p-6"><h2 className="text-base font-semibold text-[#17291f]">Debt summary</h2><p className="mt-1 text-sm text-[#718187]">Who owes what right now</p><div className="mt-4 grid gap-2">{debts.map((debt, index) => <div key={debt.userId} className="flex min-h-14 items-center gap-3 rounded-[18px] bg-[#f2f7f7] px-3"><Avatar profile={context.members.find((member) => member.user_id === debt.userId)?.profile ?? context.profile} index={index} size="sm" /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#17291f]">{debt.name}</span><strong className="text-sm tabular-nums text-[#e5484d]">{formatMoney(debt.amount, context.house.currency)}</strong></div>)}</div><p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#718187]"><ReceiptText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Payments update each member&apos;s share independently.</p></CardContent></Card>
      </div>}
  </div>;
}
