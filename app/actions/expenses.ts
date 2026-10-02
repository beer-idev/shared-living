"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const expenseSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(["electricity", "water", "internet", "grocery", "rent", "other"]),
  amount: z.coerce.number().positive().max(99999999),
  paidBy: z.string().uuid(),
  expenseDate: z.string().date(),
});

// Supabase stores these values as UUIDs. Keep the shape check, but do not
// require an RFC version/variant so seeded/demo UUIDs remain actionable too.
const databaseIdSchema = z.string().trim().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid database id",
);

export async function createExpenseAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/expenses/new?error=Connect+Supabase+to+save+this+expense");
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  const memberIds = formData.getAll("members").map(String);
  if (!parsed.success || memberIds.length === 0) redirect("/expenses/new?error=Please+complete+all+required+fields");

  const context = await getAppContext();
  const validMembers = memberIds.filter((id) => context.members.some((member) => member.user_id === id));
  if (!validMembers.length) redirect("/expenses/new?error=Select+at+least+one+housemate");
  if (!context.members.some((member) => member.user_id === parsed.data.paidBy)) redirect("/expenses/new?error=Choose+a+housemate+from+this+house");
  const supabase = await createClient();
  const { data: expense, error } = await supabase.from("expenses").insert({
    house_id: context.house.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    category: parsed.data.category,
    amount: parsed.data.amount,
    paid_by: parsed.data.paidBy,
    expense_date: parsed.data.expenseDate,
    created_by: context.userId,
  }).select("id").single();
  if (error || !expense) redirect(`/expenses/new?error=${encodeURIComponent(error?.message ?? "Could not create expense")}`);

  const baseShare = Math.floor((parsed.data.amount / validMembers.length) * 100) / 100;
  const splits = validMembers.map((userId, index) => ({
    expense_id: expense.id,
    user_id: userId,
    amount: index === validMembers.length - 1 ? Number((parsed.data.amount - baseShare * (validMembers.length - 1)).toFixed(2)) : baseShare,
    is_paid: userId === parsed.data.paidBy,
    paid_at: userId === parsed.data.paidBy ? new Date().toISOString() : null,
  }));
  const { error: splitError } = await supabase.from("expense_splits").insert(splits);
  if (splitError) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    redirect(`/expenses/new?error=${encodeURIComponent(splitError.message)}`);
  }

  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const extension = receipt.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${context.house.id}/${expense.id}/receipt.${extension}`;
    const { error: uploadError } = await supabase.storage.from("expense-receipts").upload(path, receipt, { upsert: true });
    if (!uploadError) await supabase.from("expenses").update({ receipt_path: path }).eq("id", expense.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  redirect(`/expenses/${expense.id}?created=1`);
}

export async function markSplitPaidAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/expenses?error=Connect+Supabase+to+update+payments");
  const splitResult = databaseIdSchema.safeParse(formData.get("splitId"));
  const expenseResult = databaseIdSchema.safeParse(formData.get("expenseId"));
  if (!splitResult.success || !expenseResult.success) redirect("/expenses?error=This+payment+link+is+invalid+or+expired");
  const splitId = splitResult.data;
  const expenseId = expenseResult.data;
  const context = await getAppContext();
  const supabase = await createClient();
  const { data: split, error: splitLookupError } = await supabase.from("expense_splits").select("id,user_id,expense_id").eq("id", splitId).eq("expense_id", expenseId).eq("user_id", context.userId).maybeSingle();
  if (splitLookupError || !split) redirect(`/expenses?error=You+can+only+mark+your+own+share+as+paid`);
  const { data: updatedSplit, error } = await supabase.from("expense_splits").update({ is_paid: true, paid_at: new Date().toISOString() }).eq("id", splitId).eq("expense_id", expenseId).eq("user_id", context.userId).select("id").maybeSingle();
  if (error || !updatedSplit) redirect(`/expenses?error=${encodeURIComponent(error?.message ?? "Payment could not be updated")}`);
  revalidatePath(`/expenses/${expenseId}`);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirect("/expenses?paid=1");
}
