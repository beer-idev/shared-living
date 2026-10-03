import type { Metadata } from "next";
import { CreateExpenseDialog } from "@/components/create-expense-dialog";
import { getAppContext } from "@/lib/data";
import { formatDateInput } from "@/lib/format";

export const metadata: Metadata = { title: "Create expense" };

export default async function NewExpensePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [context, query] = await Promise.all([getAppContext(), searchParams]);
  const defaultDate = formatDateInput();
  return <div className="min-h-[60dvh]"><CreateExpenseDialog members={context.members} currentUserId={context.userId} currency={context.house.currency} defaultDate={defaultDate} defaultOpen showTrigger={false} error={query.error} /></div>;
}
