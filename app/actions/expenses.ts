"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppContext } from "@/lib/data";
import { verifiedImageUrl } from "@/lib/firebase/blob";
import { db } from "@/lib/firebase/server";
import { notifyUsers } from "@/lib/firebase/store";

const schema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(["electricity", "water", "internet", "grocery", "rent", "other"]),
  amount: z.coerce.number().positive().max(99999999),
  paidBy: z.string().min(1),
  expenseDate: z.iso.date(),
});

function refreshExpenseViews(expenseId?: string) {
  revalidatePath("/expenses");
  if (expenseId) revalidatePath(`/expenses/${expenseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/members");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function createExpenseAction(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  const memberIds = [...new Set(formData.getAll("members").map(String))];
  if (!parsed.success || memberIds.length === 0) redirect("/expenses/new?error=Please+complete+all+required+fields");

  const context = await getAppContext();
  const validMemberIds = new Set(context.members.map((member) => member.user_id));
  if (!memberIds.every((id) => validMemberIds.has(id)) || !validMemberIds.has(parsed.data.paidBy) || !memberIds.includes(parsed.data.paidBy)) {
    redirect("/expenses/new?error=Choose+valid+housemates");
  }

  const database = db();
  const expenseRef = database.collection("expenses").doc();
  const cents = Math.round(parsed.data.amount * 100);
  const baseCents = Math.floor(cents / memberIds.length);
  const remainder = cents % memberIds.length;
  const splits = memberIds.map((userId, index) => ({
    id: `${expenseRef.id}_${userId}`,
    user_id: userId,
    amount: (baseCents + (index < remainder ? 1 : 0)) / 100,
    is_paid: userId === parsed.data.paidBy,
    paid_at: userId === parsed.data.paidBy ? new Date().toISOString() : null,
  }));

  const receipt = String(formData.get("receiptUrl") ?? "");
  let receiptPath: string | null = null;
  if (receipt) {
    try {
      receiptPath = await verifiedImageUrl(receipt, `expense-receipts/new/${context.userId}/`);
    } catch {
      redirect("/expenses/new?error=Receipt+upload+could+not+be+verified");
    }
  }

  const createdAt = new Date().toISOString();
  const batch = database.batch();
  batch.set(expenseRef, {
    house_id: context.house.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    category: parsed.data.category,
    amount: cents / 100,
    paid_by: parsed.data.paidBy,
    expense_date: parsed.data.expenseDate,
    created_by: context.userId,
    receipt_path: receiptPath,
    created_at: createdAt,
  });
  for (const split of splits) {
    const { id, ...data } = split;
    batch.set(database.collection("expense_splits").doc(id), {
      ...data,
      expense_id: expenseRef.id,
      house_id: context.house.id,
      created_at: createdAt,
    });
  }
  await batch.commit();

  await notifyUsers(context.members.map((member) => member.user_id), {
    type: "expense",
    title: "A new shared expense was added",
    body: `${parsed.data.title} · ${(cents / 100).toFixed(2)} ${context.house.currency}`,
    href: `/expenses/${expenseRef.id}`,
  });

  const unpaidParticipants = splits.filter((split) => !split.is_paid);
  for (const split of unpaidParticipants) {
    await notifyUsers([split.user_id], {
      type: "expense",
      title: "A shared expense needs payment",
      body: `${parsed.data.title} · ${split.amount.toFixed(2)} ${context.house.currency}`,
      href: `/expenses/${expenseRef.id}`,
    });
  }

  refreshExpenseViews(expenseRef.id);
  redirect(`/expenses/${expenseRef.id}?created=1`);
}

export async function markSplitPaidAction(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  const splitId = String(formData.get("splitId") ?? "");
  if (!expenseId || !splitId) redirect("/expenses?error=Invalid+payment");

  const context = await getAppContext();
  const database = db();
  const expenseRef = database.collection("expenses").doc(expenseId);
  const splitRef = database.collection("expense_splits").doc(splitId);
  let result: { expenseTitle: string; paidBy: string; amount: number; changed: boolean } | null = null;

  try {
    result = await database.runTransaction(async (transaction) => {
      const [expense, split] = await Promise.all([transaction.get(expenseRef), transaction.get(splitRef)]);
      if (!expense.exists || expense.get("house_id") !== context.house.id) throw new Error("Expense not found");
      if (!split.exists || split.get("expense_id") !== expenseId || split.get("house_id") !== context.house.id || split.get("user_id") !== context.userId) throw new Error("You can only pay your own share");

      const changed = !split.get("is_paid");
      if (changed) transaction.update(splitRef, { is_paid: true, paid_at: new Date().toISOString() });
      return {
        expenseTitle: String(expense.get("title") || "Shared expense"),
        paidBy: String(expense.get("paid_by") || ""),
        amount: Number(split.get("amount") ?? 0),
        changed,
      };
    });
  } catch (error) {
    redirect(`/expenses?error=${encodeURIComponent(error instanceof Error ? error.message : "Payment could not be updated")}`);
  }

  if (!result) redirect("/expenses?error=Payment+could+not+be+updated");
  const payment = result as NonNullable<typeof result>;
  if (payment.changed && payment.paidBy && payment.paidBy !== context.userId) {
    await notifyUsers([payment.paidBy], {
      type: "expense",
      title: "A housemate marked their share as paid",
      body: `${context.profile.display_name} · ${payment.expenseTitle} · ${payment.amount.toFixed(2)} ${context.house.currency}`,
      href: `/expenses/${expenseId}`,
    });
  }

  refreshExpenseViews(expenseId);
  redirect("/expenses?paid=1");
}
