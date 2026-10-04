import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { markSplitPaidAction } from "@/app/actions/expenses";
import { PageHeader } from "@/components/page-header";
import { PaymentRecordedModal } from "@/components/payment-recorded-modal";
import { ReceiptPhoto } from "@/components/receipt-photo";
import { StatusMessage } from "@/components/status-message";
import { getAppContext, getExpense, getNotifications } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Expense details" };

export default async function ExpenseDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; created?: string; paid?: string }> }) {
  const [{ id }, query, context, notifications] = await Promise.all([params, searchParams, getAppContext(), getNotifications()]);
  const expense = await getExpense(id);
  if (!expense) notFound();
  const splits = expense.splits ?? [];
  const currentSplit = splits.find((split) => split.user_id === context.userId);
  const pending = splits.some((split) => !split.is_paid);

  return <div className="figma-expense-detail"><PageHeader title={expense.title} description={`Expense details · ${expense.category} · ${formatDate(expense.expense_date)}`} unread={notifications.filter((item) => !item.read_at).length} /><StatusMessage error={query.error} success={query.created ? "Expense created and split successfully." : undefined} /><PaymentRecordedModal open={query.paid === "1"} amount={formatMoney(currentSplit?.amount ?? 0, context.house.currency)} /><Link href="/expenses" className="figma-expense-detail__back"><ArrowLeft size={18} aria-hidden="true" />Back</Link><div className="figma-expense-detail__layout"><section><span>{pending ? "Payment pending" : "Settled"}</span><h2>{expense.title}</h2><strong>{formatMoney(expense.amount, context.house.currency)}</strong><p>Paid by {expense.payer.display_name}</p><p>{expense.description || "Shared household expense"}</p>{expense.receipt_path && <ReceiptPhoto src={expense.receipt_path} title={expense.title} />}<p>{splits.length || context.members.length} members · Equal split</p><b>{formatMoney((currentSplit?.amount ?? expense.amount / (splits.length || context.members.length)), context.house.currency)} per person</b></section><section><h2>Payment tracking</h2><div>{splits.map((split) => <article key={split.id}><strong>{split.profile.display_name}</strong><b>{formatMoney(split.amount, context.house.currency)}</b><span className={split.is_paid ? "is-paid" : ""}>{split.is_paid ? `Paid${split.user_id === expense.paid_by ? " · Bill payer" : ""}` : "Unpaid"}</span></article>)}</div>{currentSplit && !currentSplit.is_paid && <form action={markSplitPaidAction}><input type="hidden" name="splitId" value={currentSplit.id} /><input type="hidden" name="expenseId" value={expense.id} /><button className="button button--primary button--wide"><CheckCircle2 size={16} /> Mark my share as paid</button></form>}<p>Use this after paying {expense.payer.display_name}. This records your share only.</p></section></div></div>;
}
