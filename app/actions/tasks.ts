"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppContext } from "@/lib/data";
import { verifiedImageUrl } from "@/lib/firebase/blob";
import { db } from "@/lib/firebase/server";
import { notifyUsers } from "@/lib/firebase/store";
import { harmonyLevel } from "@/lib/format";
import { harmonyScoreFromLedger } from "@/lib/harmony";

const schema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().max(500).optional(),
  dueAt: z.string().min(1),
  assignmentType: z.enum(["manual", "random", "rotation"]),
  assignedTo: z.string().optional(),
});

function choresPath(taskId?: string) {
  return taskId ? `/chores?task=${encodeURIComponent(taskId)}` : "/chores";
}

function refreshTaskViews(taskId?: string) {
  revalidatePath("/chores");
  if (taskId) revalidatePath(`/chores/${taskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/members");
  revalidatePath("/profile");
  revalidatePath("/harmony");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function createTaskAction(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(parsed.data.dueAt) || Number.isNaN(Date.parse(`${parsed.data.dueAt}:00+07:00`))) {
    redirect("/chores/new?error=Please+complete+all+required+fields");
  }

  const context = await getAppContext();
  if (context.members.length === 0) redirect("/chores/new?error=Add+a+housemate+before+creating+a+task");

  let assignedTo = parsed.data.assignedTo;
  if (parsed.data.assignmentType === "random") {
    assignedTo = context.members[Math.floor(Math.random() * context.members.length)]?.user_id;
  }
  if (parsed.data.assignmentType === "rotation") {
    const rows = await db().collection("tasks").where("house_id", "==", context.house.id).get();
    assignedTo = context.members[rows.size % context.members.length]?.user_id;
  }
  if (!assignedTo || !context.members.some((member) => member.user_id === assignedTo)) {
    redirect("/chores/new?error=Choose+a+valid+housemate");
  }

  const database = db();
  const ref = database.collection("tasks").doc();
  const createdAt = new Date().toISOString();
  await ref.set({
    house_id: context.house.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_at: new Date(`${parsed.data.dueAt}:00+07:00`).toISOString(),
    assignment_type: parsed.data.assignmentType,
    assigned_to: assignedTo,
    created_by: context.userId,
    created_at: createdAt,
    status: "pending",
    completion_photo_path: null,
    completed_at: null,
    overdue_penalty_applied: false,
    due_reminder_sent: false,
  });

  await notifyUsers([assignedTo], {
    type: "task",
    title: "A new task was assigned to you",
    body: parsed.data.title,
    href: choresPath(ref.id),
  });

  refreshTaskViews(ref.id);
  redirect("/chores?created=1");
}

export async function completeTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId || taskId.includes("/")) redirect("/chores?error=Invalid+task");

  const context = await getAppContext();
  const proof = String(formData.get("proofUrl") ?? "");
  let photoUrl = "";
  try {
    photoUrl = await verifiedImageUrl(proof, `task-proofs/${taskId}/${context.userId}/`);
  } catch {
    redirect(`${choresPath(taskId)}&error=Photo+upload+could+not+be+verified`);
  }

  const database = db();
  const harmonyEventRef = database.collection("harmony_events").doc();
  let result: { previousScore: number; nextScore: number; taskTitle: string; assigneeId: string } | null = null;

  try {
    result = await database.runTransaction(async (transaction) => {
      const taskRef = database.collection("tasks").doc(taskId);
      const houseRef = database.collection("houses").doc(context.house.id);
      const actorMembershipRef = database.collection("house_members").doc(context.userId);
      const [task, house, actorMembership, harmonyEvents, harmonyTasks] = await Promise.all([
        transaction.get(taskRef),
        transaction.get(houseRef),
        transaction.get(actorMembershipRef),
        transaction.get(database.collection("harmony_events").where("house_id", "==", context.house.id)),
        transaction.get(database.collection("tasks").where("house_id", "==", context.house.id)),
      ]);

      if (!task.exists || task.get("house_id") !== context.house.id || task.get("status") !== "pending") throw new Error("Task is no longer pending");
      if (!house.exists) throw new Error("House not found");
      if (!actorMembership.exists || actorMembership.get("house_id") !== context.house.id) throw new Error("You are no longer a house member");
      if (task.get("assigned_to") !== context.userId && actorMembership.get("role") !== "owner") throw new Error("You cannot complete this task");

      const assigneeId = String(task.get("assigned_to"));
      const taskTitle = String(task.get("title") || "Task");
      const assigneeRef = database.collection("house_members").doc(assigneeId);
      const assignee = assigneeId === context.userId ? actorMembership : await transaction.get(assigneeRef);
      if (!assignee.exists || assignee.get("house_id") !== context.house.id) throw new Error("Assignee is no longer a member");

      const previousScore = harmonyScoreFromLedger(
        harmonyEvents.docs.map((row) => ({ taskId: row.get("task_id") as string | null, points: Number(row.get("points") ?? 0), reason: String(row.get("reason") ?? "") })),
        harmonyTasks.docs.map((row) => ({ id: row.id, status: String(row.get("status") ?? "pending") })),
      );
      const nextScore = Math.min(100, previousScore + 10);
      const awardedPoints = nextScore - previousScore;
      const completedAt = new Date().toISOString();

      transaction.update(taskRef, { status: "completed", completion_photo_path: photoUrl, completed_at: completedAt });
      transaction.update(assigneeRef, { points: Number(assignee.get("points") ?? 0) + 10 });
      transaction.update(houseRef, { harmony_score: nextScore, updated_at: completedAt });
      transaction.set(harmonyEventRef, {
        house_id: context.house.id,
        user_id: assigneeId,
        task_id: taskId,
        points: awardedPoints,
        reason: "task_completed",
        created_at: completedAt,
      });
      return { previousScore, nextScore, taskTitle, assigneeId };
    });
  } catch (error) {
    if (photoUrl) await del(photoUrl).catch(() => {});
    redirect(`${choresPath(taskId)}&error=${encodeURIComponent(error instanceof Error ? error.message : "Task could not be completed")}`);
  }

  if (!result) redirect(`${choresPath(taskId)}&error=Task+could+not+be+completed`);
  const completed = result as NonNullable<typeof result>;
  await notifyUsers(
    context.members.filter((member) => member.user_id !== context.userId).map((member) => member.user_id),
    {
      type: "task",
      title: "A housemate completed a task",
      body: `${context.profile.display_name} completed ${completed.taskTitle}`,
      href: choresPath(taskId),
    },
  );

  const levelUp = harmonyLevel(completed.nextScore).level > harmonyLevel(completed.previousScore).level;
  if (levelUp) {
    const reached = harmonyLevel(completed.nextScore);
    await notifyUsers(context.members.map((member) => member.user_id), {
      type: "harmony",
      title: `Your house reached ${reached.name}`,
      body: `Level ${reached.level} is ready to celebrate.`,
      href: "/harmony#celebration",
    });
  }
  refreshTaskViews(taskId);
  redirect(`/chores?completed=1&task=${encodeURIComponent(taskId)}${levelUp ? "&levelUp=1" : ""}`);
}

export async function reactToTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const reaction = z.enum(["appreciate", "thanks", "looks_great"]).safeParse(formData.get("reaction"));
  if (!taskId || taskId.includes("/") || !reaction.success) redirect("/chores?error=Invalid+reaction");

  const context = await getAppContext();
  const database = db();
  const reactionRef = database.collection("task_reactions").doc(`${taskId}_${context.userId}`);
  const bonusEventRef = database.collection("harmony_events").doc(`${taskId}_first_appreciation`);
  let result: { bonus: boolean; previousScore: number; nextScore: number; assigneeId: string; taskTitle: string } | null = null;

  try {
    result = await database.runTransaction(async (transaction) => {
      const taskRef = database.collection("tasks").doc(taskId);
      const houseRef = database.collection("houses").doc(context.house.id);
      const [task, house, existingReaction, existingBonus, harmonyEvents, harmonyTasks] = await Promise.all([
        transaction.get(taskRef),
        transaction.get(houseRef),
        transaction.get(reactionRef),
        transaction.get(bonusEventRef),
        transaction.get(database.collection("harmony_events").where("house_id", "==", context.house.id)),
        transaction.get(database.collection("tasks").where("house_id", "==", context.house.id)),
      ]);

      if (!task.exists || task.get("house_id") !== context.house.id || task.get("status") !== "completed") throw new Error("Task is not completed");
      if (!house.exists) throw new Error("House not found");

      const assigneeId = String(task.get("assigned_to"));
      const taskTitle = String(task.get("title") || "Task");
      if (assigneeId === context.userId) throw new Error("You cannot react to your own task");

      const memberRef = database.collection("house_members").doc(assigneeId);
      const member = await transaction.get(memberRef);
      if (!member.exists || member.get("house_id") !== context.house.id) throw new Error("Assignee is no longer a member");

      const bonus = !existingReaction.exists && !existingBonus.exists;
      const previousScore = harmonyScoreFromLedger(
        harmonyEvents.docs.map((row) => ({ taskId: row.get("task_id") as string | null, points: Number(row.get("points") ?? 0), reason: String(row.get("reason") ?? "") })),
        harmonyTasks.docs.map((row) => ({ id: row.id, status: String(row.get("status") ?? "pending") })),
      );
      const nextScore = bonus ? Math.min(100, previousScore + 5) : previousScore;
      const awardedPoints = nextScore - previousScore;
      const now = new Date().toISOString();

      if (existingReaction.exists) transaction.update(reactionRef, { reaction: reaction.data, updated_at: now });
      else transaction.create(reactionRef, { task_id: taskId, house_id: context.house.id, user_id: context.userId, reaction: reaction.data, created_at: now });

      if (bonus) {
        transaction.update(memberRef, { points: Number(member.get("points") ?? 0) + 5 });
        transaction.update(houseRef, { harmony_score: nextScore, updated_at: now });
        transaction.create(bonusEventRef, {
          house_id: context.house.id,
          user_id: assigneeId,
          task_id: taskId,
          points: awardedPoints,
          reason: "first_appreciation",
          created_at: now,
        });
      }
      return { bonus, previousScore, nextScore, assigneeId, taskTitle };
    });
  } catch (error) {
    redirect(`${choresPath(taskId)}&error=${encodeURIComponent(error instanceof Error ? error.message : "Reaction could not be saved")}`);
  }

  if (!result) redirect(`${choresPath(taskId)}&error=Reaction+could+not+be+saved`);
  const savedReaction = result as NonNullable<typeof result>;
  const reactionLabel = reaction.data === "looks_great" ? "Looks great" : reaction.data === "appreciate" ? "Appreciate" : "Thanks";
  await notifyUsers([savedReaction.assigneeId], {
    type: "task",
    title: savedReaction.bonus ? "You received +5 bonus points" : "A housemate reacted to your task",
    body: `${context.profile.display_name}: ${reactionLabel} · ${savedReaction.taskTitle}`,
    href: choresPath(taskId),
  });

  const levelUp = harmonyLevel(savedReaction.nextScore).level > harmonyLevel(savedReaction.previousScore).level;
  if (levelUp) {
    const reached = harmonyLevel(savedReaction.nextScore);
    await notifyUsers(context.members.map((member) => member.user_id), {
      type: "harmony",
      title: `Your house reached ${reached.name}`,
      body: `Level ${reached.level} is ready to celebrate.`,
      href: "/harmony#celebration",
    });
  }
  refreshTaskViews(taskId);
  redirect(`/chores?task=${encodeURIComponent(taskId)}&reacted=1${savedReaction.bonus ? "&bonus=1" : ""}${levelUp ? "&levelUp=1" : ""}`);
}
