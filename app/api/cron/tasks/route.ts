import { db } from "@/lib/firebase/server";
import { notifyUsers } from "@/lib/firebase/store";
import { harmonyScoreFromLedger } from "@/lib/harmony";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  const database = db();
  const now = Date.now();
  const rows = await database.collection("tasks").where("status", "==", "pending").get();
  let reminded = 0;
  let overdue = 0;
  for (const row of rows.docs) {
    const due = Date.parse(String(row.get("due_at") ?? ""));
    if (!Number.isFinite(due)) continue;
    const result = await database.runTransaction(async (transaction) => {
      const task = await transaction.get(row.ref);
      if (task.get("status") !== "pending") return null;
      const houseId = String(task.get("house_id"));
      const assignee = String(task.get("assigned_to"));
      if (due < now && !task.get("overdue_penalty_applied")) {
        const houseRef = database.collection("houses").doc(houseId);
        const eventRef = database.collection("harmony_events").doc(`${row.id}_overdue`);
        const [house, harmonyEvents, harmonyTasks] = await Promise.all([
          transaction.get(houseRef),
          transaction.get(database.collection("harmony_events").where("house_id", "==", houseId)),
          transaction.get(database.collection("tasks").where("house_id", "==", houseId)),
        ]);
        transaction.update(row.ref, { overdue_penalty_applied: true });
        let appliedPenalty = 0;
        if (house.exists) {
          const previousScore = harmonyScoreFromLedger(
            harmonyEvents.docs.map((event) => ({ taskId: event.get("task_id") as string | null, points: Number(event.get("points") ?? 0), reason: String(event.get("reason") ?? "") })),
            harmonyTasks.docs.map((item) => ({ id: item.id, status: String(item.get("status") ?? "pending") })),
          );
          appliedPenalty = Math.min(5, previousScore);
          transaction.update(houseRef, { harmony_score: previousScore - appliedPenalty, updated_at: new Date().toISOString() });
          transaction.create(eventRef, { house_id: houseId, user_id: null, task_id: row.id, points: -appliedPenalty, reason: "task_overdue", created_at: new Date().toISOString() });
        }
        return { type: "overdue" as const, assignee, houseId, title: String(task.get("title")), appliedPenalty };
      }
      if (due >= now && due <= now + 24 * 60 * 60 * 1000 && !task.get("due_reminder_sent")) {
        transaction.update(row.ref, { due_reminder_sent: true });
        return { type: "reminder" as const, assignee, houseId, title: String(task.get("title")), appliedPenalty: 0 };
      }
      return null;
    });
    if (result) {
      const recipients = result.type === "overdue"
        ? (await database.collection("house_members").where("house_id", "==", result.houseId).get()).docs.map((member) => member.id)
        : [result.assignee];
      await notifyUsers(recipients, {
        type: "task",
        title: result.type === "overdue" ? "An overdue task affected House Harmony" : "A task is due soon",
        body: result.type === "overdue"
          ? `${result.title} · ${result.appliedPenalty ? `-${result.appliedPenalty} harmony points` : "harmony is already at 0"}`
          : result.title,
        href: `/chores?task=${row.id}`,
      });
      if (result.type === "overdue") overdue++; else reminded++;
    }
  }
  return Response.json({ reminded, overdue });
}
