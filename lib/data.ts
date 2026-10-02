import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import { previewContext, previewExpenses, previewNotifications, previewTasks } from "./preview-data";
import type { AppContext, Celebration, Expense, ExpenseSplit, ExpenseSummary, HouseDebt, MemberStats, Notification, Task } from "./types";

const previewSettledExpenses = new Set(["Fiber internet", "August rent", "Movie night snacks"]);

function previewExpenseSplits(context: AppContext, expense: Expense): ExpenseSplit[] {
  const amount = Number((expense.amount / context.members.length).toFixed(2));
  const settled = previewSettledExpenses.has(expense.title);
  return context.members.map((member, index) => ({
    id: `${expense.id.slice(0, -3)}${(Number.parseInt(expense.id.slice(-3), 16) * 16 + index + 1).toString(16).padStart(3, "0")}`,
    user_id: member.user_id,
    amount: index === context.members.length - 1 ? Number((expense.amount - amount * (context.members.length - 1)).toFixed(2)) : amount,
    is_paid: settled || member.user_id === expense.paid_by,
    profile: member.profile,
  }));
}

export const getAppContext = cache(async (): Promise<AppContext> => {
  if (!isSupabaseConfigured) return previewContext;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: membership, error }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_path, task_reminders, bill_alerts, house_activity").eq("id", user.id).single(),
    supabase.from("house_members").select("role, house:houses(id,name,invite_code,currency,harmony_score)").eq("user_id", user.id).limit(1).single(),
  ]);
  if (error || !membership?.house) redirect("/onboarding");

  const house = Array.isArray(membership.house) ? membership.house[0] : membership.house;
  const { data: memberRows } = await supabase
    .from("house_members")
    .select("user_id, role, profile:profiles(id,display_name,avatar_path,task_reminders,bill_alerts,house_activity)")
    .eq("house_id", house.id)
    .order("joined_at");
  const { data: harmonyRows } = await supabase.from("harmony_events").select("user_id, points").eq("house_id", house.id);
  const pointMap = new Map<string, number>();
  harmonyRows?.forEach((row) => row.user_id && pointMap.set(row.user_id, (pointMap.get(row.user_id) ?? 0) + row.points));

  return {
    preview: false,
    userId: user.id,
    email: user.email ?? "",
    profile: profile!,
    house,
    members: (memberRows ?? []).map((row) => ({
      user_id: row.user_id,
      role: row.role,
      profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
      points: pointMap.get(row.user_id) ?? 0,
    })),
  } as AppContext;
});

export async function getExpenses(): Promise<Expense[]> {
  const context = await getAppContext();
  if (context.preview) {
    return previewExpenses.map((expense) => ({ ...expense, splits: previewExpenseSplits(context, expense) }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("id,title,description,category,amount,expense_date,paid_by,payer:profiles!expenses_paid_by_fkey(id,display_name,avatar_path),splits:expense_splits(id,user_id,amount,is_paid,profile:profiles(id,display_name,avatar_path))").eq("house_id", context.house.id).order("expense_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount), payer: Array.isArray(row.payer) ? row.payer[0] : row.payer, splits: (row.splits ?? []).map((split) => ({ ...split, amount: Number(split.amount), profile: Array.isArray(split.profile) ? split.profile[0] : split.profile })) })) as Expense[];
}

export async function getExpense(id: string): Promise<Expense | null> {
  const context = await getAppContext();
  if (context.preview) {
    const expense = previewExpenses.find((item) => item.id === id);
    if (!expense) return null;
    return { ...expense, splits: previewExpenseSplits(context, expense) };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("id,title,description,category,amount,expense_date,paid_by,payer:profiles!expenses_paid_by_fkey(id,display_name,avatar_path),splits:expense_splits(id,user_id,amount,is_paid,profile:profiles(id,display_name,avatar_path))").eq("id", id).eq("house_id", context.house.id).single();
  if (error) return null;
  return { ...data, amount: Number(data.amount), payer: Array.isArray(data.payer) ? data.payer[0] : data.payer, splits: (data.splits ?? []).map((split) => ({ ...split, amount: Number(split.amount), profile: Array.isArray(split.profile) ? split.profile[0] : split.profile })) as ExpenseSplit[] } as Expense;
}

export async function getTasks(): Promise<Task[]> {
  const context = await getAppContext();
  if (context.preview) return previewTasks;
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("id,title,description,due_at,assignment_type,assigned_to,status,completion_photo_path,completed_at,assignee:profiles!tasks_assigned_to_fkey(id,display_name,avatar_path)").eq("house_id", context.house.id).order("due_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, assignee: Array.isArray(row.assignee) ? row.assignee[0] : row.assignee })) as Task[];
}

export async function getTask(id: string): Promise<Task | null> {
  const tasks = await getTasks();
  return tasks.find((task) => task.id === id) ?? null;
}

export async function getNotifications(): Promise<Notification[]> {
  const context = await getAppContext();
  if (context.preview) return previewNotifications;
  const supabase = await createClient();
  const { data, error } = await supabase.from("notifications").select("id,type,title,body,href,read_at,created_at").eq("user_id", context.userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data as Notification[];
}

export async function getExpenseSummary(): Promise<ExpenseSummary> {
  const context = await getAppContext();
  if (context.preview) return { total: 24399, owed: 1245, owedCount: 3, receivable: 1085, receivableCount: 3, settledPercent: 50 };
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const nextMonth = new Date(monthStart);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const [{ data: expenseRows, error: expenseError }, { data: splitRows, error: splitError }] = await Promise.all([
    supabase.from("expenses").select("amount").eq("house_id", context.house.id).gte("expense_date", monthStart.toISOString().slice(0, 10)).lt("expense_date", nextMonth.toISOString().slice(0, 10)),
    supabase.from("expense_splits").select("amount,is_paid,user_id,expense:expenses!inner(house_id,paid_by,expense_date)").eq("expense.house_id", context.house.id).gte("expense.expense_date", monthStart.toISOString().slice(0, 10)).lt("expense.expense_date", nextMonth.toISOString().slice(0, 10)),
  ]);
  if (expenseError) throw expenseError;
  if (splitError) throw splitError;
  const splits = (splitRows ?? []).map((row) => ({
    amount: Number(row.amount),
    isPaid: row.is_paid,
    userId: row.user_id,
    paidBy: (Array.isArray(row.expense) ? row.expense[0] : row.expense)?.paid_by as string | undefined,
  }));
  const unsettled = splits.filter((split) => !split.isPaid);
  const owed = unsettled.filter((split) => split.userId === context.userId);
  const receivable = unsettled.filter((split) => split.paidBy === context.userId && split.userId !== context.userId);
  return {
    total: (expenseRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0),
    owed: owed.reduce((sum, split) => sum + split.amount, 0),
    owedCount: owed.length,
    receivable: receivable.reduce((sum, split) => sum + split.amount, 0),
    receivableCount: new Set(receivable.map((split) => split.userId)).size,
    settledPercent: splits.length ? Math.round((splits.filter((split) => split.isPaid).length / splits.length) * 100) : 100,
  };
}

export async function getMemberStats(): Promise<MemberStats> {
  const context = await getAppContext();
  if (context.preview) return Object.fromEntries(context.members.map((member, index) => [member.user_id, { chores: Math.max(0, 12 - index * 2), bills: 6 + index, thanks: Math.max(1, 4 - index) }]));
  const supabase = await createClient();
  const [{ data: tasks }, { data: expenses }, { data: reactions }] = await Promise.all([
    supabase.from("tasks").select("assigned_to").eq("house_id", context.house.id).eq("status", "completed"),
    supabase.from("expenses").select("paid_by").eq("house_id", context.house.id),
    supabase.from("task_reactions").select("user_id,task:tasks!inner(house_id,assigned_to)").eq("task.house_id", context.house.id),
  ]);
  return Object.fromEntries(context.members.map((member) => {
    const thanks = (reactions ?? []).filter((row) => {
      const task = Array.isArray(row.task) ? row.task[0] : row.task;
      return task?.assigned_to === member.user_id;
    }).length;
    return [member.user_id, {
      chores: (tasks ?? []).filter((row) => row.assigned_to === member.user_id).length,
      bills: (expenses ?? []).filter((row) => row.paid_by === member.user_id).length,
      thanks,
    }];
  }));
}

export async function getHouseDebts(): Promise<HouseDebt[]> {
  const context = await getAppContext();
  if (context.preview) {
    const amounts = [625, 620, 1245, 1085];
    return context.members.map((member, index) => ({ userId: member.user_id, name: member.profile.display_name, amount: amounts[index] ?? 0 }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("expense_splits").select("user_id,amount,expense:expenses!inner(house_id)").eq("expense.house_id", context.house.id).eq("is_paid", false);
  if (error) throw error;
  const totals = new Map<string, number>();
  for (const row of data ?? []) totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + Number(row.amount));
  return context.members.map((member) => ({ userId: member.user_id, name: member.profile.display_name, amount: totals.get(member.user_id) ?? 0 }));
}

export async function getUpcomingCelebration(): Promise<Celebration | null> {
  const context = await getAppContext();
  if (context.preview) return { id: "preview-celebration", title: "Movie night", location: "Living room", starts_at: new Date(Date.now() + 86400000).toISOString() };
  const supabase = await createClient();
  const { data, error } = await supabase.from("celebrations").select("id,title,location,starts_at").eq("house_id", context.house.id).gte("starts_at", new Date().toISOString()).order("starts_at").limit(1).maybeSingle();
  if (error) throw error;
  return data as Celebration | null;
}
