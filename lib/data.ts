import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { currentUser, db, isFirebaseConfigured } from "./firebase/server";
import { documentData, houseMembers } from "./firebase/store";
import { formatDateInput } from "./format";
import type { AppContext, Celebration, Expense, ExpenseSplit, ExpenseSummary, House, HouseDebt, MemberStats, Notification, Profile, Task } from "./types";

type StoredExpense = Omit<Expense, "payer" | "splits"> & { house_id: string };
type StoredSplit = Omit<ExpenseSplit, "profile"> & { house_id: string; expense_id: string };
type StoredTask = Omit<Task, "assignee" | "reaction_counts" | "my_reaction"> & { house_id: string };
type StoredReaction = { task_id: string; house_id: string; user_id: string; reaction: "appreciate" | "thanks" | "looks_great" };

function historicalProfile(id: string): Profile {
  return { id, display_name: "Former housemate", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true };
}

export const getAppContext = cache(async (): Promise<AppContext> => {
  if (!isFirebaseConfigured) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login");
  const membership = await db().collection("house_members").doc(user.uid).get();
  if (!membership.exists) redirect("/onboarding");
  const houseId = String(membership.get("house_id"));
  const [house, profile, members] = await Promise.all([
    db().collection("houses").doc(houseId).get(),
    db().collection("profiles").doc(user.uid).get(),
    houseMembers(houseId),
  ]);
  if (!house.exists) redirect("/onboarding");
  const storedHouse = documentData<House>(house)!;
  return {
    preview: false, userId: user.uid, email: user.email ?? "",
    house: storedHouse,
    profile: documentData<Profile>(profile) ?? { id: user.uid, display_name: user.name ?? user.email ?? "Housemate", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true },
    members,
  };
});

export const getExpenses = cache(async (): Promise<Expense[]> => {
  const context = await getAppContext();
  const [expenseRows, splitRows] = await Promise.all([
    db().collection("expenses").where("house_id", "==", context.house.id).get(),
    db().collection("expense_splits").where("house_id", "==", context.house.id).get(),
  ]);
  const profiles = new Map(context.members.map((member) => [member.user_id, member.profile]));
  const splitsByExpense = new Map<string, StoredSplit[]>();
  for (const row of splitRows.docs) {
    const split = documentData<StoredSplit>(row)!;
    const group = splitsByExpense.get(split.expense_id) ?? [];
    group.push(split);
    splitsByExpense.set(split.expense_id, group);
  }
  return expenseRows.docs.map((row) => {
    const expense = documentData<StoredExpense>(row)!;
    const splits = (splitsByExpense.get(expense.id) ?? []).map((split) => ({
      id: split.id, user_id: split.user_id, amount: split.amount,
      is_paid: split.is_paid, paid_at: split.paid_at,
      profile: profiles.get(split.user_id) ?? historicalProfile(split.user_id),
    }));
    return { ...expense, payer: profiles.get(expense.paid_by) ?? historicalProfile(expense.paid_by), splits };
  }).sort((a, b) => b.expense_date.localeCompare(a.expense_date));
});

export const getExpense = cache(async (id: string): Promise<Expense | null> => {
  return (await getExpenses()).find((expense) => expense.id === id) ?? null;
});

export const getTasks = cache(async (): Promise<Task[]> => {
  const context = await getAppContext();
  const [taskRows, reactionRows] = await Promise.all([
    db().collection("tasks").where("house_id", "==", context.house.id).get(),
    db().collection("task_reactions").where("house_id", "==", context.house.id).get(),
  ]);
  const profiles = new Map(context.members.map((member) => [member.user_id, member.profile]));
  const reactionsByTask = new Map<string, StoredReaction[]>();
  for (const row of reactionRows.docs) {
    const reaction = documentData<StoredReaction>(row)!;
    const group = reactionsByTask.get(reaction.task_id) ?? [];
    group.push(reaction);
    reactionsByTask.set(reaction.task_id, group);
  }
  return taskRows.docs.map((row) => {
    const task = documentData<StoredTask>(row)!;
    const reactions = reactionsByTask.get(task.id) ?? [];
    const counts = { appreciate: 0, thanks: 0, looks_great: 0 };
    for (const reaction of reactions) counts[reaction.reaction]++;
    return {
      ...task,
      assignee: task.assigned_to ? profiles.get(task.assigned_to) ?? null : null,
      reaction_counts: counts,
      my_reaction: reactions.find((reaction) => reaction.user_id === context.userId)?.reaction ?? null,
    };
  }).sort((a, b) => a.due_at.localeCompare(b.due_at));
});

export const getTask = cache(async (id: string): Promise<Task | null> => {
  return (await getTasks()).find((task) => task.id === id) ?? null;
});

export const getNotifications = cache(async (): Promise<Notification[]> => {
  const context = await getAppContext();
  const rows = await db().collection("notifications").where("user_id", "==", context.userId).get();
  return rows.docs.map((row) => documentData<Notification>(row)!).sort((a, b) => b.created_at.localeCompare(a.created_at));
});

export const getExpenseSummary = cache(async (): Promise<ExpenseSummary> => {
  const context = await getAppContext();
  const expenses = (await getExpenses()).filter((expense) => expense.expense_date.slice(0, 7) === formatDateInput().slice(0, 7));
  const splits = expenses.flatMap((expense) => (expense.splits ?? []).map((split) => ({ ...split, paidBy: expense.paid_by })));
  const unpaid = splits.filter((split) => !split.is_paid);
  const owed = unpaid.filter((split) => split.user_id === context.userId);
  const receivable = unpaid.filter((split) => split.paidBy === context.userId && split.user_id !== context.userId);
  return { total: expenses.reduce((sum, expense) => sum + expense.amount, 0), owed: owed.reduce((sum, split) => sum + split.amount, 0), owedCount: owed.length, receivable: receivable.reduce((sum, split) => sum + split.amount, 0), receivableCount: new Set(receivable.map((split) => split.user_id)).size, settledPercent: splits.length ? Math.round((splits.filter((split) => split.is_paid).length / splits.length) * 100) : 100 };
});

export const getMemberStats = cache(async (): Promise<MemberStats> => {
  const context = await getAppContext();
  const [tasks, expenses] = await Promise.all([getTasks(), getExpenses()]);
  return Object.fromEntries(context.members.map((member) => [member.user_id, {
    chores: tasks.filter((task) => task.status === "completed" && task.assigned_to === member.user_id).length,
    bills: expenses.filter((expense) => expense.splits?.some((split) => split.user_id === member.user_id && split.is_paid)).length,
    thanks: tasks.reduce((count, task) => count + (task.assigned_to === member.user_id ? Object.values(task.reaction_counts ?? {}).reduce((sum, value) => sum + value, 0) : 0), 0),
  }]));
});

export const getHouseDebts = cache(async (): Promise<HouseDebt[]> => {
  const [context, expenses] = await Promise.all([getAppContext(), getExpenses()]);
  return context.members.map((member) => ({ userId: member.user_id, name: member.profile.display_name, amount: expenses.flatMap((expense) => expense.splits ?? []).filter((split) => split.user_id === member.user_id && !split.is_paid).reduce((sum, split) => sum + split.amount, 0) }));
});

export const getUpcomingCelebration = cache(async (): Promise<Celebration | null> => {
  const context = await getAppContext();
  const rows = await db().collection("celebrations").where("house_id", "==", context.house.id).get();
  return rows.docs.map((row) => documentData<Celebration>(row)!).filter((item) => item.starts_at >= new Date().toISOString()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null;
});
